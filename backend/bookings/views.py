from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from .models import Booking
from .serializers import BookingSerializer, BookingCreateSerializer

class BookingListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BookingCreateSerializer
        return BookingSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ['HOTEL_OWNER', 'HOTEL_STAFF']:
            return Booking.objects.filter(hotel__owner=user).order_by('-created_at')
        elif user.is_staff or user.role in ['ADMIN', 'SUPER_ADMIN', 'SUPPORT_AGENT']:
            return Booking.objects.all().order_by('-created_at')
        return Booking.objects.filter(customer=user).order_by('-created_at')

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        if request.user.role not in ['CUSTOMER', 'ADMIN', 'SUPER_ADMIN']:
            return Response(
                {"error": "Only Customer accounts are allowed to make room reservations. Hotel Owners and Admins manage properties."},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()

        # Save immutable price snapshot & set pending payment expiration timeout (15 mins)
        booking.expires_at = timezone.now() + timedelta(minutes=15)
        booking.price_snapshot = {
            'price_per_night': float(booking.price_per_night),
            'number_of_nights': booking.number_of_nights,
            'number_of_rooms': booking.number_of_rooms,
            'subtotal': float(booking.subtotal),
            'cleaning_fee': float(booking.cleaning_fee),
            'service_fee': float(booking.service_fee),
            'taxes': float(booking.taxes),
            'discount': float(booking.discount),
            'total_amount': float(booking.total_amount),
            'currency': booking.currency,
            'created_at_timestamp': timezone.now().isoformat()
        }
        booking.save(update_fields=['expires_at', 'price_snapshot'])

        return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)


class BookingDetailView(generics.RetrieveAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        lookup = self.kwargs.get('pk')
        booking = None

        if str(lookup).isdigit():
            booking = Booking.objects.filter(pk=int(lookup)).first()
        
        if not booking:
            booking = Booking.objects.filter(booking_id=lookup).first()

        if not booking:
            from rest_framework.exceptions import NotFound
            raise NotFound("Booking receipt not found.")

        user = self.request.user
        if (
            booking.customer != user and 
            booking.hotel.owner != user and 
            not user.is_staff and 
            user.role not in ['ADMIN', 'SUPER_ADMIN', 'SUPPORT_AGENT', 'HOTEL_STAFF']
        ):
            raise permissions.PermissionDenied("You do not have permission to view this booking.")
        return booking


class BookingCancelView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            lookup = str(pk)
            booking = Booking.objects.filter(pk=int(lookup)).first() if lookup.isdigit() else Booking.objects.filter(booking_id=lookup).first()

            if not booking:
                return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

            user = request.user
            if booking.customer != user and booking.hotel.owner != user and not user.is_staff and user.role not in ['ADMIN', 'SUPER_ADMIN']:
                return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

            if booking.booking_status in [Booking.STATUS_CANCELLED, Booking.STATUS_REFUNDED]:
                return Response({"error": "Booking is already cancelled."}, status=status.HTTP_400_BAD_REQUEST)

            if booking.booking_status in [Booking.STATUS_CHECKED_OUT, Booking.STATUS_COMPLETED, Booking.STATUS_CHECKED_IN]:
                return Response({"error": "Cannot cancel a stay after check-in or check-out."}, status=status.HTTP_400_BAD_REQUEST)

            today = timezone.now().date()
            if booking.check_out <= today:
                return Response({"error": "Cannot cancel a stay on or after check-out date."}, status=status.HTTP_400_BAD_REQUEST)

            booking.booking_status = Booking.STATUS_CANCELLED
            booking.payment_status = Booking.PAYMENT_REFUNDED
            booking.cancelled_at = timezone.now()
            booking.save()

            # Push Notifications for Customer & Owner
            from notifications.utils import create_notification
            from notifications.models import Notification
            create_notification(
                recipient=booking.customer,
                title=f"❌ Booking Cancelled ({booking.booking_id})",
                message=f"Your reservation at {booking.hotel.name} for {booking.check_in} has been cancelled. Refund has been processed.",
                notification_type=Notification.TYPE_BOOKING_CANCELLED,
                booking=booking
            )
            create_notification(
                recipient=booking.hotel.owner,
                title=f"⚠️ Guest Cancelled Stay ({booking.booking_id})",
                message=f"Guest {booking.guest_name} cancelled their reservation at {booking.hotel.name} ({booking.check_in} to {booking.check_out}).",
                notification_type=Notification.TYPE_BOOKING_CANCELLED,
                booking=booking
            )

            return Response({
                "message": f"Booking {booking.booking_id} cancelled successfully.",
                "refund_amount": float(booking.total_amount),
                "cancellation_fee": 0.00,
                "status": booking.booking_status
            }, status=status.HTTP_200_OK)

        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)


class StaffCheckInView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        lookup = str(pk)
        booking = Booking.objects.filter(pk=int(lookup)).first() if lookup.isdigit() else Booking.objects.filter(booking_id=lookup).first()

        if not booking:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.user != booking.hotel.owner and not request.user.is_staff and request.user.role not in ['ADMIN', 'SUPER_ADMIN', 'HOTEL_STAFF']:
            return Response({"error": "Permission denied to perform check-in."}, status=status.HTTP_403_FORBIDDEN)

        booking.booking_status = Booking.STATUS_CHECKED_IN
        booking.actual_check_in_at = timezone.now()
        booking.action_by_staff = request.user
        booking.save()

        # Push Notification for Guest
        from notifications.utils import create_notification
        from notifications.models import Notification
        create_notification(
            recipient=booking.customer,
            title=f"🔑 Checked In: {booking.hotel.name}",
            message=f"Welcome! You have been successfully checked in to Room {booking.room_number or booking.room.title}. Enjoy your stay!",
            notification_type=Notification.TYPE_CHECKED_IN,
            booking=booking
        )

        return Response({
            "message": f"Guest {booking.guest_name} checked in successfully for Booking {booking.booking_id}.",
            "status": booking.booking_status,
            "actual_check_in_at": booking.actual_check_in_at
        }, status=status.HTTP_200_OK)


class StaffCheckOutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        lookup = str(pk)
        booking = Booking.objects.filter(pk=int(lookup)).first() if lookup.isdigit() else Booking.objects.filter(booking_id=lookup).first()

        if not booking:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.user != booking.hotel.owner and not request.user.is_staff and request.user.role not in ['ADMIN', 'SUPER_ADMIN', 'HOTEL_STAFF']:
            return Response({"error": "Permission denied to perform check-out."}, status=status.HTTP_403_FORBIDDEN)

        booking.booking_status = Booking.STATUS_CHECKED_OUT
        booking.actual_check_out_at = timezone.now()
        booking.action_by_staff = request.user
        booking.save()

        # Push Notification for Guest
        from notifications.utils import create_notification
        from notifications.models import Notification
        create_notification(
            recipient=booking.customer,
            title=f"👋 Check-Out Complete: {booking.hotel.name}",
            message=f"Thank you for staying at {booking.hotel.name}! Your check-out for booking {booking.booking_id} is completed. Please rate your stay.",
            notification_type=Notification.TYPE_CHECKED_OUT,
            booking=booking
        )

        return Response({
            "message": f"Booking {booking.booking_id} completed check-out successfully.",
            "status": booking.booking_status,
            "actual_check_out_at": booking.actual_check_out_at
        }, status=status.HTTP_200_OK)


class StaffNoShowView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        lookup = str(pk)
        booking = Booking.objects.filter(pk=int(lookup)).first() if lookup.isdigit() else Booking.objects.filter(booking_id=lookup).first()

        if not booking:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.user != booking.hotel.owner and not request.user.is_staff and request.user.role not in ['ADMIN', 'SUPER_ADMIN', 'HOTEL_STAFF']:
            return Response({"error": "Permission denied to mark no-show."}, status=status.HTTP_403_FORBIDDEN)

        booking.booking_status = Booking.STATUS_NO_SHOW
        booking.action_by_staff = request.user
        booking.save()

        return Response({
            "message": f"Booking {booking.booking_id} marked as NO_SHOW.",
            "status": booking.booking_status
        }, status=status.HTTP_200_OK)
