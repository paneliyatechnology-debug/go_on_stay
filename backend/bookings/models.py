import uuid
from django.db import models
from django.conf import settings
from hotels.models import Hotel
from rooms.models import Room

class Booking(models.Model):
    STATUS_PENDING_PAYMENT = 'PENDING_PAYMENT'
    STATUS_CONFIRMED = 'CONFIRMED'
    STATUS_CHECKED_IN = 'CHECKED_IN'
    STATUS_CHECKED_OUT = 'CHECKED_OUT'
    STATUS_CANCELLED = 'CANCELLED'
    STATUS_COMPLETED = 'COMPLETED'
    STATUS_REFUND_PENDING = 'REFUND_PENDING'
    STATUS_REFUNDED = 'REFUNDED'
    STATUS_NO_SHOW = 'NO_SHOW'
    STATUS_EXPIRED = 'EXPIRED'

    BOOKING_STATUS_CHOICES = (
        (STATUS_PENDING_PAYMENT, 'Pending Payment'),
        (STATUS_CONFIRMED, 'Confirmed'),
        (STATUS_CHECKED_IN, 'Checked In'),
        (STATUS_CHECKED_OUT, 'Checked Out'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_CANCELLED, 'Cancelled'),
        (STATUS_REFUND_PENDING, 'Refund Pending'),
        (STATUS_REFUNDED, 'Refunded'),
        (STATUS_NO_SHOW, 'No Show'),
        (STATUS_EXPIRED, 'Expired'),
    )

    PAYMENT_PENDING = 'PENDING'
    PAYMENT_PAID = 'PAID'
    PAYMENT_FAILED = 'FAILED'
    PAYMENT_PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED'
    PAYMENT_REFUNDED = 'REFUNDED'

    PAYMENT_STATUS_CHOICES = (
        (PAYMENT_PENDING, 'Pending'),
        (PAYMENT_PAID, 'Paid'),
        (PAYMENT_FAILED, 'Failed'),
        (PAYMENT_PARTIALLY_REFUNDED, 'Partially Refunded'),
        (PAYMENT_REFUNDED, 'Refunded'),
    )

    booking_id = models.CharField(max_length=50, unique=True, db_index=True)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bookings'
    )
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='bookings')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='bookings')
    
    check_in = models.DateField(db_index=True)
    check_out = models.DateField(db_index=True)
    number_of_guests = models.IntegerField(default=2)
    number_of_rooms = models.IntegerField(default=1)
    room_number = models.CharField(max_length=150, blank=True, null=True, help_text="Specific assigned room number e.g. 101, 102 or Villa-1")
    
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    number_of_nights = models.IntegerField(default=1)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    cleaning_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    service_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    taxes = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')
    
    price_snapshot = models.JSONField(blank=True, null=True, help_text="Immutable financial price calculation snapshot")

    payment_status = models.CharField(max_length=30, choices=PAYMENT_STATUS_CHOICES, default=PAYMENT_PENDING)
    booking_status = models.CharField(max_length=30, choices=BOOKING_STATUS_CHOICES, default=STATUS_PENDING_PAYMENT)
    
    razorpay_order_id = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    
    guest_name = models.CharField(max_length=150)
    guest_email = models.EmailField()
    guest_phone = models.CharField(max_length=20)
    meal_plan = models.CharField(max_length=50, default='ROOM_ONLY')
    estimated_arrival_time = models.CharField(max_length=50, default='12:00 PM - 02:00 PM')
    special_requests = models.TextField(blank=True, null=True)
    
    confirmed_at = models.DateTimeField(blank=True, null=True)
    cancelled_at = models.DateTimeField(blank=True, null=True)
    actual_check_in_at = models.DateTimeField(blank=True, null=True)
    actual_check_out_at = models.DateTimeField(blank=True, null=True)
    action_by_staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True, related_name='processed_stay_actions')
    
    expires_at = models.DateTimeField(blank=True, null=True, help_text="Pending booking auto-expiration timestamp")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.booking_id:
            unique_num = uuid.uuid4().hex[:6].upper()
            self.booking_id = f"KH-2026-{unique_num}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Booking {self.booking_id} - {self.hotel.name} ({self.customer.username})"
