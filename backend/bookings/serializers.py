from rest_framework import serializers
from decimal import Decimal
from datetime import datetime
from .models import Booking
from rooms.models import Room
from rooms.utils import get_available_room_count
from hotels.serializers import HotelSerializer
from rooms.serializers import RoomSerializer

class BookingSerializer(serializers.ModelSerializer):
    hotel_details = HotelSerializer(source='hotel', read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)

    payment_details = serializers.SerializerMethodField()
    user_review = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = (
            'id', 'booking_id', 'customer', 'customer_name', 'hotel', 'hotel_details',
            'room', 'room_details', 'room_number', 'check_in', 'check_out', 'number_of_guests',
            'number_of_rooms', 'price_per_night', 'number_of_nights', 'subtotal',
            'cleaning_fee', 'service_fee', 'taxes', 'discount', 'total_amount', 'currency',
            'payment_status', 'booking_status', 'razorpay_order_id', 'payment_details', 'user_review',
            'guest_name', 'guest_email', 'guest_phone', 'meal_plan', 'estimated_arrival_time', 'special_requests',
            'confirmed_at', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'booking_id', 'customer', 'created_at', 'updated_at')

    def get_user_review(self, obj):
        if hasattr(obj, 'review') and obj.review:
            return {
                'id': obj.review.id,
                'rating': obj.review.rating,
                'comment': obj.review.comment,
                'created_at': obj.review.created_at
            }
        return None

    def get_payment_details(self, obj):
        captured_payment = obj.payments.filter(status='CAPTURED').first() or obj.payments.first()
        if captured_payment:
            return {
                'razorpay_payment_id': captured_payment.razorpay_payment_id,
                'razorpay_order_id': captured_payment.razorpay_order_id,
                'payment_method': captured_payment.payment_method or 'Razorpay Online',
                'status': captured_payment.status,
                'paid_at': captured_payment.paid_at,
            }
        return None

class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = (
            'hotel', 'room', 'room_number', 'check_in', 'check_out', 'number_of_guests',
            'number_of_rooms', 'guest_name', 'guest_email', 'guest_phone',
            'meal_plan', 'estimated_arrival_time', 'special_requests', 'discount'
        )

    def validate(self, attrs):
        check_in = attrs.get('check_in')
        check_out = attrs.get('check_out')
        room = attrs.get('room')
        room_number = attrs.get('room_number')
        requested_rooms = attrs.get('number_of_rooms', 1)

        if check_in >= check_out:
            raise serializers.ValidationError({"check_out": "Check-out date must be after Check-in date."})

        # Real-time Date Overlap Concurrency Check
        available_count = get_available_room_count(room, check_in, check_out)
        if available_count < requested_rooms:
            raise serializers.ValidationError({
                "room": f"Sorry! Only {available_count} room(s) available for the requested dates. Please select alternative dates."
            })

        # Specific Room Number Overlap Check
        # Only CONFIRMED and CHECKED_IN bookings block a room number.
        # PENDING_PAYMENT does NOT block — room is only truly reserved after payment.
        if room_number:
            requested_num_list = [r.strip() for r in room_number.split(',') if r.strip()]
            for single_num in requested_num_list:
                is_taken = Booking.objects.filter(
                    room=room,
                    room_number__icontains=single_num,
                    booking_status__in=[
                        Booking.STATUS_CONFIRMED,
                        Booking.STATUS_CHECKED_IN,
                    ],
                    check_in__lt=check_out,
                    check_out__gt=check_in
                ).exists()

                if is_taken:
                    raise serializers.ValidationError({
                        "room_number": f"Sorry! Room {single_num} is already booked for the selected dates. Please select a different room number."
                    })

        return attrs

    def create(self, validated_data):
        customer = self.context['request'].user
        room = validated_data['room']
        check_in = validated_data['check_in']
        check_out = validated_data['check_out']
        requested_rooms = validated_data.get('number_of_rooms', 1)
        discount = Decimal(str(validated_data.get('discount', 0.00)))

        # Price Calculation Logic
        nights = (check_out - check_in).days
        if nights < 1:
            nights = 1

        price_per_night = room.price_per_night
        subtotal = price_per_night * nights * requested_rooms
        taxes = subtotal * Decimal('0.18') # 18% GST Tax
        total_amount = max(Decimal('0.00'), subtotal + taxes - discount)

        # Remove keys that will be explicitly passed
        validated_data.pop('discount', None)

        booking = Booking.objects.create(
            customer=customer,
            price_per_night=price_per_night,
            number_of_nights=nights,
            subtotal=subtotal,
            taxes=taxes,
            discount=discount,
            total_amount=total_amount,
            booking_status=Booking.STATUS_PENDING_PAYMENT,
            payment_status=Booking.PAYMENT_PENDING,
            **validated_data
        )
        return booking

