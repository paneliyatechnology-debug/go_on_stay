from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import datetime
from .models import Room, RoomImage, RoomCalendarBlock
from .serializers import RoomSerializer, RoomCreateUpdateSerializer, RoomImageSerializer, RoomCalendarBlockSerializer
from .utils import get_available_room_count
from hotels.models import Hotel

class RoomListView(generics.ListCreateAPIView):
    queryset = Room.objects.all().order_by('price_per_night')
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return RoomCreateUpdateSerializer
        return RoomSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['check_in'] = self.request.query_params.get('check_in')
        context['check_out'] = self.request.query_params.get('check_out')
        return context

    def perform_create(self, serializer):
        hotel = serializer.validated_data['hotel']
        if hotel.owner != self.request.user and not self.request.user.is_staff:
            raise permissions.PermissionDenied("You do not own this hotel property.")
        serializer.save()

class RoomDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Room.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return RoomCreateUpdateSerializer
        return RoomSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['check_in'] = self.request.query_params.get('check_in')
        context['check_out'] = self.request.query_params.get('check_out')
        return context

class RoomsByHotelView(generics.ListAPIView):
    serializer_class = RoomSerializer
    permission_classes = [permissions.AllowAny]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['check_in'] = self.request.query_params.get('check_in')
        context['check_out'] = self.request.query_params.get('check_out')
        return context

    def get_queryset(self):
        hotel_id = self.kwargs['hotel_id']
        queryset = Room.objects.filter(hotel_id=hotel_id).order_by('price_per_night')

        check_in = self.request.query_params.get('check_in')
        check_out = self.request.query_params.get('check_out')
        requested_rooms = int(self.request.query_params.get('rooms', 1))

        if check_in and check_out:
            # Filter rooms that have at least requested_rooms available for the date range
            valid_room_ids = []
            for room in queryset:
                available = get_available_room_count(room, check_in, check_out)
                if available >= requested_rooms:
                    valid_room_ids.append(room.id)
            queryset = queryset.filter(id__in=valid_room_ids)

        return queryset

class CheckAvailabilityView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from bookings.models import Booking
        room_id = request.query_params.get('room_id')
        check_in = request.query_params.get('check_in')
        check_out = request.query_params.get('check_out')
        requested_rooms = int(request.query_params.get('rooms', 1))

        if not room_id or not check_in or not check_out:
            return Response({"error": "room_id, check_in, and check_out parameters are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            room = Room.objects.get(id=room_id)
            available_count = get_available_room_count(room, check_in, check_out)
            is_available = available_count >= requested_rooms

            # Calculate individual room numbers availability
            # RULE: Only CONFIRMED and CHECKED_IN bookings mark a room as reserved.
            # PENDING_PAYMENT does NOT block rooms — payment must succeed first.
            all_nums = room.get_all_room_numbers()
            active_bookings = Booking.objects.filter(
                room=room,
                booking_status__in=[
                    Booking.STATUS_CONFIRMED,
                    Booking.STATUS_CHECKED_IN,
                ],
                check_in__lt=check_out,
                check_out__gt=check_in
            )

            explicit_reserved = set()
            for b in active_bookings:
                if b.room_number:
                    for num_item in b.room_number.split(','):
                        if num_item.strip():
                            explicit_reserved.add(num_item.strip())

            unassigned_count = active_bookings.filter(room_number__isnull=True).count()

            room_numbers_status = []
            for num in all_nums:
                if num in explicit_reserved:
                    room_numbers_status.append({"number": num, "is_available": False, "status": "RESERVED"})
                elif unassigned_count > 0:
                    room_numbers_status.append({"number": num, "is_available": False, "status": "RESERVED"})
                    unassigned_count -= 1
                else:
                    room_numbers_status.append({"number": num, "is_available": True, "status": "AVAILABLE"})

            return Response({
                "room_id": room.id,
                "room_title": room.title,
                "check_in": check_in,
                "check_out": check_out,
                "requested_rooms": requested_rooms,
                "total_physical_rooms": room.total_rooms,
                "available_rooms_count": available_count,
                "is_available": is_available,
                "room_numbers": room_numbers_status,
                "message": "Room is available for requested dates!" if is_available else f"Only {available_count} room(s) available for requested dates."
            }, status=status.HTTP_200_OK)

        except Room.DoesNotExist:
            return Response({"error": "Room not found."}, status=status.HTTP_404_NOT_FOUND)

class RoomImageUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            room = Room.objects.get(pk=pk)
            if room.hotel.owner != request.user and not request.user.is_staff:
                return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

            image = request.FILES.get('image')
            image_url = request.data.get('image_url')
            is_primary = request.data.get('is_primary', 'false').lower() == 'true'

            if not image and not image_url:
                return Response({"error": "Please provide an image file or URL."}, status=status.HTTP_400_BAD_REQUEST)

            room_image = RoomImage.objects.create(
                room=room,
                image=image,
                image_url=image_url,
                is_primary=is_primary
            )
            return Response(RoomImageSerializer(room_image).data, status=status.HTTP_201_CREATED)
        except Room.DoesNotExist:
            return Response({"error": "Room not found."}, status=status.HTTP_404_NOT_FOUND)


class RoomCalendarManageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            room = Room.objects.get(pk=pk)
            blocks = room.calendar_blocks.all()
            return Response(RoomCalendarBlockSerializer(blocks, many=True).data)
        except Room.DoesNotExist:
            return Response({"error": "Room not found."}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, pk):
        try:
            room = Room.objects.get(pk=pk)
            if room.hotel.owner != request.user and not request.user.is_staff:
                return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

            date_str = request.data.get('date')
            custom_price = request.data.get('custom_price')
            is_blocked = request.data.get('is_blocked', False)
            block_reason = request.data.get('block_reason', RoomCalendarBlock.REASON_OWNER_BLOCK)

            if not date_str:
                return Response({"error": "Date parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

            block, created = RoomCalendarBlock.objects.update_or_create(
                room=room,
                date=date_str,
                defaults={
                    'custom_price': custom_price if custom_price else None,
                    'is_blocked': is_blocked,
                    'block_reason': block_reason
                }
            )

            return Response(RoomCalendarBlockSerializer(block).data, status=status.HTTP_200_OK)

        except Room.DoesNotExist:
            return Response({"error": "Room not found."}, status=status.HTTP_404_NOT_FOUND)

