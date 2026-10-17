from django.db import models
from django.conf import settings
from bookings.models import Booking

class Notification(models.Model):
    TYPE_STAY_REMINDER = 'STAY_REMINDER'
    TYPE_BOOKING_CONFIRMED = 'BOOKING_CONFIRMED'
    TYPE_NEW_BOOKING_OWNER = 'NEW_BOOKING_OWNER'
    TYPE_HOTEL_APPROVED = 'HOTEL_APPROVED'
    TYPE_HOTEL_REJECTED = 'HOTEL_REJECTED'
    TYPE_CHECKED_IN = 'CHECKED_IN'
    TYPE_CHECKED_OUT = 'CHECKED_OUT'
    TYPE_BOOKING_CANCELLED = 'BOOKING_CANCELLED'
    TYPE_CHECKOUT_REMINDER = 'CHECKOUT_REMINDER'
    TYPE_GENERAL = 'GENERAL'

    NOTIFICATION_TYPE_CHOICES = (
        (TYPE_STAY_REMINDER, 'Stay Reminder (Next Day of Check-in)'),
        (TYPE_BOOKING_CONFIRMED, 'Booking Confirmed'),
        (TYPE_NEW_BOOKING_OWNER, 'New Booking for Host'),
        (TYPE_HOTEL_APPROVED, 'Hotel Approved'),
        (TYPE_HOTEL_REJECTED, 'Hotel Rejected'),
        (TYPE_CHECKED_IN, 'Checked In'),
        (TYPE_CHECKED_OUT, 'Checked Out'),
        (TYPE_BOOKING_CANCELLED, 'Booking Cancelled'),
        (TYPE_CHECKOUT_REMINDER, 'Checkout Reminder'),
        (TYPE_GENERAL, 'General Notification'),
    )

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications'
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=40,
        choices=NOTIFICATION_TYPE_CHOICES,
        default=TYPE_GENERAL
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification to {self.recipient.username}: {self.title}"
