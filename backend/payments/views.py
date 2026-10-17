import json
import uuid
import logging
from decimal import Decimal
from django.db import transaction
from django.conf import settings
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
import razorpay
from razorpay.errors import SignatureVerificationError, BadRequestError

from .models import (
    Payment, Refund, WebhookEvent, HostEarning,
    HostPayout, PlatformSetting, SupportTicket, TicketMessage,
    CustomerHotelMessage, AuditLog
)
from .serializers import (
    PaymentSerializer, RefundSerializer, WebhookEventSerializer,
    HostEarningSerializer, PaymentOrderCreateSerializer, PaymentVerifySerializer,
    PaymentRetrySerializer, RefundCreateSerializer, HostPayoutSerializer,
    PlatformSettingSerializer, SupportTicketSerializer, TicketMessageSerializer,
    CustomerHotelMessageSerializer, AuditLogSerializer
)
from bookings.models import Booking

logger = logging.getLogger(__name__)

def get_razorpay_client(hotel=None):
    """
    Returns (razorpay.Client, key_id) configured with the specific Hotel Owner's credentials
    if provided on their user account, otherwise falls back to platform default credentials.
    """
    if hotel and hasattr(hotel, 'owner') and hotel.owner:
        owner_key_id = getattr(hotel.owner, 'razorpay_key_id', None)
        owner_key_secret = getattr(hotel.owner, 'razorpay_key_secret', None)
        if owner_key_id and owner_key_secret and str(owner_key_id).strip() and str(owner_key_secret).strip():
            return razorpay.Client(auth=(str(owner_key_id).strip(), str(owner_key_secret).strip())), str(owner_key_id).strip()

    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)), settings.RAZORPAY_KEY_ID

class CreateOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PaymentOrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking_id = serializer.validated_data['booking_id']

        try:
            booking = Booking.objects.get(booking_id=booking_id)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        if booking.customer != request.user and not request.user.is_staff:
            return Response({"error": "You do not have permission to pay for this booking."}, status=status.HTTP_403_FORBIDDEN)

        if booking.booking_status not in [Booking.STATUS_PENDING_PAYMENT, 'PENDING']:
            return Response(
                {"error": f"Booking is not in pending payment state. Current status: {booking.booking_status}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Server-side total calculation verification
        nights = max((booking.check_out - booking.check_in).days, 1)
        calculated_subtotal = Decimal(str(booking.price_per_night)) * nights * Decimal(str(booking.number_of_rooms))
        calculated_total = calculated_subtotal + Decimal(str(booking.cleaning_fee)) + Decimal(str(booking.service_fee)) + Decimal(str(booking.taxes)) - Decimal(str(booking.discount))
        
        if calculated_total <= 0:
            calculated_total = Decimal('1.00')

        amount_in_paise = int(round(calculated_total * 100))

        client, active_key_id = get_razorpay_client(booking.hotel)

        try:
            # Check if a valid real Razorpay order already exists for this booking (not a fake mock order)
            existing_payment = Payment.objects.filter(
                booking=booking,
                status=Payment.STATUS_CREATED,
                amount=calculated_total
            ).first()

            if (
                existing_payment 
                and existing_payment.razorpay_order_id 
                and existing_payment.razorpay_order_id.startswith('order_') 
                and not existing_payment.razorpay_order_id.startswith('order_test_')
                and not existing_payment.razorpay_order_id.startswith('order_fake_')
                and not existing_payment.razorpay_order_id.startswith('order_retry_')
            ):
                order_id = existing_payment.razorpay_order_id
            else:
                # Create a fresh REAL order directly on Razorpay's servers
                razorpay_order = client.order.create({
                    "amount": amount_in_paise,
                    "currency": "INR",
                    "receipt": f"rcpt_{booking.id}_{int(timezone.now().timestamp())}",
                    "notes": {
                        "booking_id": booking.booking_id,
                        "customer_id": str(request.user.id),
                        "hotel_id": str(booking.hotel.id)
                    }
                })
                order_id = razorpay_order["id"]

                Payment.objects.create(
                    booking=booking,
                    user=request.user,
                    razorpay_order_id=order_id,
                    amount=calculated_total,
                    currency="INR",
                    status=Payment.STATUS_CREATED
                )

            booking.razorpay_order_id = order_id
            booking.save(update_fields=['razorpay_order_id'])

            return Response({
                "order_id": order_id,
                "amount": amount_in_paise,
                "currency": "INR",
                "key_id": active_key_id,
                "booking_id": booking.booking_id,
                "customer": {
                    "name": booking.guest_name,
                    "email": booking.guest_email,
                    "phone": booking.guest_phone,
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Razorpay Order creation error: {str(e)}")
            return Response({"error": f"Failed to create Razorpay payment order: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PaymentVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        booking_id = serializer.validated_data['booking_id']
        razorpay_order_id = serializer.validated_data['razorpay_order_id']
        razorpay_payment_id = serializer.validated_data['razorpay_payment_id']
        razorpay_signature = serializer.validated_data['razorpay_signature']

        try:
            booking = Booking.objects.get(booking_id=booking_id)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        if booking.customer != request.user and not request.user.is_staff:
            return Response({"error": "Unauthorized payment verification request."}, status=status.HTTP_403_FORBIDDEN)

        # Idempotency Check: If payment already captured, return existing confirmed result
        existing_captured = Payment.objects.filter(
            razorpay_payment_id=razorpay_payment_id,
            status=Payment.STATUS_CAPTURED
        ).first()

        if existing_captured:
            return Response({
                "status": "success",
                "message": "Payment already verified and captured.",
                "booking_id": booking.booking_id,
                "payment_id": existing_captured.razorpay_payment_id,
                "confirmed_at": booking.confirmed_at
            }, status=status.HTTP_200_OK)

        client, _ = get_razorpay_client(booking.hotel)

        # Step 1: Server-side HMAC SHA256 Signature Verification
        params_dict = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }

        try:
            client.utility.verify_payment_signature(params_dict)
        except SignatureVerificationError:
            logger.warning(f"Security Alert: Signature Verification Failed for booking {booking_id}, order {razorpay_order_id}")
            
            payment, _ = Payment.objects.get_or_create(
                razorpay_order_id=razorpay_order_id,
                defaults={
                    'booking': booking,
                    'user': request.user,
                    'amount': booking.total_amount,
                    'currency': 'INR',
                    'status': Payment.STATUS_FAILED,
                    'failure_reason': 'Invalid HMAC Signature'
                }
            )
            payment.status = Payment.STATUS_FAILED
            payment.failure_reason = 'Invalid HMAC Signature'
            payment.save()

            booking.payment_status = Booking.PAYMENT_FAILED
            booking.save(update_fields=['payment_status'])

            return Response({"error": "Payment verification failed. Invalid security signature."}, status=status.HTTP_400_BAD_REQUEST)

        # Step 2: Fetch Payment details directly from Razorpay API
        try:
            payment_detail = client.payment.fetch(razorpay_payment_id)
        except Exception as e:
            return Response({"error": f"Failed to fetch payment status from Razorpay: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        expected_paise = int(round(booking.total_amount * 100))

        if payment_detail['amount'] != expected_paise:
            logger.error(f"Amount Mismatch: Expected {expected_paise}, got {payment_detail['amount']}")
            return Response({"error": "Payment amount mismatch detected. Transaction declined."}, status=status.HTTP_400_BAD_REQUEST)

        if payment_detail['currency'] != 'INR':
            return Response({"error": "Currency mismatch detected."}, status=status.HTTP_400_BAD_REQUEST)

        # Step 3: Database Transaction & Booking Confirmation
        with transaction.atomic():
            booking_to_update = Booking.objects.select_for_update().get(id=booking.id)

            payment_obj, _ = Payment.objects.get_or_create(
                razorpay_order_id=razorpay_order_id,
                defaults={
                    'booking': booking_to_update,
                    'user': request.user,
                    'amount': booking_to_update.total_amount,
                    'currency': 'INR'
                }
            )

            payment_obj.razorpay_payment_id = razorpay_payment_id
            payment_obj.razorpay_signature = razorpay_signature
            payment_obj.status = Payment.STATUS_CAPTURED
            payment_obj.payment_method = payment_detail.get('method', 'card')
            payment_obj.paid_at = timezone.now()
            payment_obj.save()

            booking_to_update.booking_status = Booking.STATUS_CONFIRMED
            booking_to_update.payment_status = Booking.PAYMENT_PAID
            booking_to_update.confirmed_at = timezone.now()
            booking_to_update.save()

            # Create Push Notifications for Customer & Hotel Owner
            from notifications.utils import create_notification
            from notifications.models import Notification
            create_notification(
                recipient=booking_to_update.customer,
                title=f"🎉 Booking Confirmed! ({booking_to_update.booking_id})",
                message=f"Your stay at {booking_to_update.hotel.name} from {booking_to_update.check_in} to {booking_to_update.check_out} is confirmed! Amount Paid: ₹{booking_to_update.total_amount}.",
                notification_type=Notification.TYPE_BOOKING_CONFIRMED,
                booking=booking_to_update
            )
            create_notification(
                recipient=booking_to_update.hotel.owner,
                title=f"🛎️ New Guest Booking Alert! ({booking_to_update.booking_id})",
                message=f"Guest {booking_to_update.guest_name} booked {booking_to_update.room.title} at {booking_to_update.hotel.name} from {booking_to_update.check_in} to {booking_to_update.check_out} (Total ₹{booking_to_update.total_amount}).",
                notification_type=Notification.TYPE_NEW_BOOKING_OWNER,
                booking=booking_to_update
            )

            # Create Host Earnings Ledger entry (10% platform fee)
            gross = booking_to_update.total_amount
            platform_fee = round(gross * Decimal('0.10'), 2)
            net = gross - platform_fee

            HostEarning.objects.update_or_create(
                booking=booking_to_update,
                defaults={
                    'host': booking_to_update.hotel.owner,
                    'gross_amount': gross,
                    'platform_fee': platform_fee,
                    'tax': Decimal('0.00'),
                    'net_amount': net,
                    'status': HostEarning.STATUS_AVAILABLE,
                    'available_at': timezone.now()
                }
            )

        return Response({
            "status": "success",
            "message": "Payment verified and booking confirmed successfully.",
            "booking_id": booking.booking_id,
            "payment_id": razorpay_payment_id,
            "confirmed_at": booking.confirmed_at
        }, status=status.HTTP_200_OK)


class WebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        raw_body = request.body.decode('utf-8')
        signature = request.headers.get('X-Razorpay-Signature') or request.META.get('HTTP_X_RAZORPAY_SIGNATURE')

        if not signature:
            return Response({"error": "Missing signature header."}, status=status.HTTP_400_BAD_REQUEST)

        client = get_razorpay_client()

        try:
            client.utility.verify_webhook_signature(raw_body, signature, settings.RAZORPAY_WEBHOOK_SECRET)
        except SignatureVerificationError:
            logger.warning("Invalid Webhook Signature received.")
            return Response({"error": "Invalid webhook signature."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            event_data = json.loads(raw_body)
            event_id = event_data.get('event_id') or event_data.get('id') or f"evt_{timezone.now().timestamp()}"
            event_type = event_data.get('event')
        except Exception:
            return Response({"error": "Invalid JSON body."}, status=status.HTTP_400_BAD_REQUEST)

        # Webhook Idempotency: Ignore if event already processed
        webhook_obj, created = WebhookEvent.objects.get_or_create(
            event_id=event_id,
            defaults={
                'event_type': event_type,
                'payload': event_data,
                'processed': False
            }
        )

        if not created and webhook_obj.processed:
            return Response({"status": "ignored", "message": "Event already processed."}, status=status.HTTP_200_OK)

        # Handle Webhook Events
        try:
            payload_entity = event_data.get('payload', {}).get('payment', {}).get('entity', {})
            order_id = payload_entity.get('order_id')
            payment_id = payload_entity.get('id')

            if event_type in ['payment.captured', 'order.paid'] and order_id:
                payment = Payment.objects.filter(razorpay_order_id=order_id).first()
                if payment:
                    payment.status = Payment.STATUS_CAPTURED
                    payment.razorpay_payment_id = payment_id
                    payment.paid_at = timezone.now()
                    payment.save()

                    booking = payment.booking
                    if booking.booking_status != Booking.STATUS_CONFIRMED:
                        booking.booking_status = Booking.STATUS_CONFIRMED
                        booking.payment_status = Booking.PAYMENT_PAID
                        booking.confirmed_at = timezone.now()
                        booking.save()

            elif event_type == 'payment.failed' and order_id:
                payment = Payment.objects.filter(razorpay_order_id=order_id).first()
                if payment:
                    payment.status = Payment.STATUS_FAILED
                    payment.failure_reason = payload_entity.get('error_description', 'Payment failed')
                    payment.error_code = payload_entity.get('error_code', 'PAYMENT_FAILED')
                    payment.save()

            webhook_obj.processed = True
            webhook_obj.processed_at = timezone.now()
            webhook_obj.save()

            return Response({"status": "success", "event": event_type}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error processing webhook {event_id}: {str(e)}")
            return Response({"error": f"Webhook processing error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RetryPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PaymentRetrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking_id = serializer.validated_data['booking_id']

        try:
            booking = Booking.objects.get(booking_id=booking_id)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        if booking.customer != request.user and not request.user.is_staff:
            return Response({"error": "Unauthorized payment retry request."}, status=status.HTTP_403_FORBIDDEN)

        if booking.booking_status == Booking.STATUS_CONFIRMED:
            return Response({"error": "Booking is already confirmed and paid."}, status=status.HTTP_400_BAD_REQUEST)

        if booking.booking_status == Booking.STATUS_CANCELLED:
            return Response({"error": "Cannot retry payment for a cancelled booking."}, status=status.HTTP_400_BAD_REQUEST)

        # Create new order for retrying payment
        client = get_razorpay_client()
        amount_in_paise = int(round(booking.total_amount * 100))

        try:
            razorpay_order = client.order.create({
                "amount": amount_in_paise,
                "currency": "INR",
                "receipt": f"retry_{booking.booking_id}_{int(timezone.now().timestamp())}",
                "notes": {"booking_id": booking.booking_id, "retry": "true"}
            })
            order_id = razorpay_order["id"]

            Payment.objects.create(
                booking=booking,
                user=request.user,
                razorpay_order_id=order_id,
                amount=booking.total_amount,
                currency="INR",
                status=Payment.STATUS_CREATED
            )

            booking.razorpay_order_id = order_id
            booking.booking_status = Booking.STATUS_PENDING_PAYMENT
            booking.payment_status = Booking.PAYMENT_PENDING
            booking.save()

            return Response({
                "order_id": order_id,
                "amount": amount_in_paise,
                "currency": "INR",
                "key_id": settings.RAZORPAY_KEY_ID,
                "booking_id": booking.booking_id
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": f"Failed to retry payment order: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RefundView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = RefundCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        booking_id = serializer.validated_data['booking_id']
        reason = serializer.validated_data.get('reason', 'Booking refund requested')

        try:
            booking = Booking.objects.get(booking_id=booking_id)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        if not (request.user.is_staff or request.user.role == 'ADMIN' or booking.customer == request.user or booking.hotel.owner == request.user):
            return Response({"error": "Permission denied to initiate refund."}, status=status.HTTP_403_FORBIDDEN)

        captured_payment = Payment.objects.filter(booking=booking, status=Payment.STATUS_CAPTURED).first()
        if not captured_payment or not captured_payment.razorpay_payment_id:
            return Response({"error": "No captured payment found for this booking to refund."}, status=status.HTTP_400_BAD_REQUEST)

        refund_amount = serializer.validated_data.get('amount') or booking.total_amount
        refund_paise = int(round(refund_amount * 100))

        client = get_razorpay_client()

        try:
            razorpay_refund = client.payment.refund(captured_payment.razorpay_payment_id, {
                "amount": refund_paise,
                "notes": {"booking_id": booking.booking_id, "reason": reason}
            })

            refund_id = razorpay_refund["id"]

            refund_obj = Refund.objects.create(
                booking=booking,
                payment=captured_payment,
                razorpay_payment_id=captured_payment.razorpay_payment_id,
                razorpay_refund_id=refund_id,
                amount=refund_amount,
                currency="INR",
                reason=reason,
                status=Refund.STATUS_PROCESSED,
                processed_at=timezone.now()
            )

            booking.booking_status = Booking.STATUS_REFUNDED
            booking.payment_status = Booking.PAYMENT_REFUNDED
            booking.cancelled_at = timezone.now()
            booking.save()

            captured_payment.status = Payment.STATUS_REFUNDED
            captured_payment.save()

            # Reverse Host Earnings
            HostEarning.objects.filter(booking=booking).update(
                status=HostEarning.STATUS_REVERSED,
                refund_amount=refund_amount
            )

            return Response({
                "message": "Refund processed successfully.",
                "refund_id": refund_id,
                "amount": float(refund_amount),
                "status": "PROCESSED"
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Refund initiation failed: {str(e)}")
            return Response({"error": f"Refund processing failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminPaymentListView(generics.ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser or user.role in ['ADMIN', 'SUPER_ADMIN']:
            return Payment.objects.all().order_by('-created_at')
        return Payment.objects.none()


class AdminRefundListView(generics.ListAPIView):
    serializer_class = RefundSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser or user.role in ['ADMIN', 'SUPER_ADMIN']:
            return Refund.objects.all().order_by('-created_at')
        return Refund.objects.none()


class HostPayoutListCreateView(generics.ListCreateAPIView):
    serializer_class = HostPayoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.role in ['ADMIN', 'SUPER_ADMIN']:
            return HostPayout.objects.all().order_by('-created_at')
        return HostPayout.objects.filter(host=user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(host=self.request.user, status=HostPayout.STATUS_PENDING)


class PlatformSettingsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        setting = PlatformSetting.objects.first()
        if not setting:
            setting = PlatformSetting.objects.create()
        return Response(PlatformSettingSerializer(setting).data)

    def put(self, request):
        if not (request.user.is_authenticated and (request.user.is_staff or request.user.role in ['ADMIN', 'SUPER_ADMIN'])):
            return Response({"error": "Admin permission required."}, status=status.HTTP_403_FORBIDDEN)
        
        setting = PlatformSetting.objects.first()
        if not setting:
            setting = PlatformSetting.objects.create()
        
        serializer = PlatformSettingSerializer(setting, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class SupportTicketListCreateView(generics.ListCreateAPIView):
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.role in ['ADMIN', 'SUPER_ADMIN', 'SUPPORT_AGENT']:
            return SupportTicket.objects.all().order_by('-created_at')
        return SupportTicket.objects.filter(user=user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SupportTicketDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.role in ['ADMIN', 'SUPER_ADMIN', 'SUPPORT_AGENT']:
            return SupportTicket.objects.all()
        return SupportTicket.objects.filter(user=user)


class TicketMessageCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            ticket = SupportTicket.objects.get(pk=pk)
            user = request.user
            if ticket.user != user and not user.is_staff and user.role not in ['ADMIN', 'SUPER_ADMIN', 'SUPPORT_AGENT']:
                return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

            msg_text = request.data.get('message')
            if not msg_text:
                return Response({"error": "Message content is required."}, status=status.HTTP_400_BAD_REQUEST)

            msg = TicketMessage.objects.create(
                ticket=ticket,
                sender=user,
                message=msg_text,
                attachment_url=request.data.get('attachment_url')
            )
            return Response(TicketMessageSerializer(msg).data, status=status.HTTP_201_CREATED)

        except SupportTicket.DoesNotExist:
            return Response({"error": "Support ticket not found."}, status=status.HTTP_404_NOT_FOUND)


class CustomerHotelChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, booking_id):
        try:
            booking = Booking.objects.get(booking_id=booking_id)
            user = request.user
            if booking.customer != user and booking.hotel.owner != user and not user.is_staff:
                return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

            messages = CustomerHotelMessage.objects.filter(booking=booking).order_by('created_at')
            return Response(CustomerHotelMessageSerializer(messages, many=True).data)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, booking_id):
        try:
            booking = Booking.objects.get(booking_id=booking_id)
            user = request.user
            if booking.customer != user and booking.hotel.owner != user and not user.is_staff:
                return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

            receiver = booking.hotel.owner if user == booking.customer else booking.customer
            msg_text = request.data.get('message')
            if not msg_text:
                return Response({"error": "Message body is required."}, status=status.HTTP_400_BAD_REQUEST)

            chat = CustomerHotelMessage.objects.create(
                booking=booking,
                sender=user,
                receiver=receiver,
                message=msg_text
            )
            return Response(CustomerHotelMessageSerializer(chat).data, status=status.HTTP_201_CREATED)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)


class AdminAuditLogListView(generics.ListAPIView):
    queryset = AuditLog.objects.all().order_by('-created_at')
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAdminUser]


class CreateHostSubscriptionOrderView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        plan_id = request.data.get('plan_id', 'gold')
        amount = request.data.get('amount')

        plan_prices = {
            'silver': 1999,
            'gold': 3999,
            'platinum': 7999,
        }

        if not amount:
            amount = plan_prices.get(str(plan_id).lower(), 3999)

        amount_in_paise = int(round(Decimal(str(amount)) * 100))

        client = get_razorpay_client()

        try:
            razorpay_order = client.order.create({
                "amount": amount_in_paise,
                "currency": "INR",
                "receipt": f"host_sub_{int(timezone.now().timestamp())}",
                "notes": {
                    "plan_id": str(plan_id),
                    "type": "HOST_SUBSCRIPTION"
                }
            })

            return Response({
                "order_id": razorpay_order["id"],
                "amount": amount_in_paise,
                "currency": "INR",
                "key_id": settings.RAZORPAY_KEY_ID,
                "plan_id": plan_id
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Razorpay Host Subscription Order creation error: {str(e)}")
            return Response({"error": f"Failed to create Razorpay payment order: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyHostSubscriptionPaymentView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')

        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            return Response({"error": "Missing Razorpay payment verification fields."}, status=status.HTTP_400_BAD_REQUEST)

        client = get_razorpay_client()
        params_dict = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }

        try:
            client.utility.verify_payment_signature(params_dict)
            return Response({
                "status": "success",
                "message": "Host subscription payment verified successfully.",
                "transaction_id": razorpay_payment_id,
                "order_id": razorpay_order_id
            }, status=status.HTTP_200_OK)
        except SignatureVerificationError:
            return Response({"error": "Payment verification failed. Invalid Razorpay signature."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Host subscription verification error: {str(e)}")
            return Response({"error": f"Verification error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


