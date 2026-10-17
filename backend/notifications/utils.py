from datetime import timedelta
from django.utils import timezone
from bookings.models import Booking
from .models import Notification

def create_notification(recipient, title, message, notification_type=Notification.TYPE_GENERAL, booking=None):
    """
    Central helper function to create notifications cleanly across the app.
    """
    if not recipient:
        return None
    try:
        return Notification.objects.create(
            recipient=recipient,
            booking=booking,
            title=title,
            message=message,
            notification_type=notification_type
        )
    except Exception as e:
        print(f"Failed to create notification: {e}")
        return None

def check_and_create_stay_reminders(user):
    """
    Checks if user has any active/confirmed bookings where today is on or after checkin + 1 day
    (i.e. check-in was yesterday or earlier) and stay is still active.
    If no stay reminder exists for that booking, generate one automatically.
    """
    if not user or not user.is_authenticated:
        return

    today = timezone.now().date()

    # Active/confirmed/checked-in bookings for this user where today >= check_in + 1 day
    eligible_bookings = Booking.objects.filter(
        customer=user,
        booking_status__in=[Booking.STATUS_CONFIRMED, Booking.STATUS_CHECKED_IN],
        check_in__lte=today - timedelta(days=1), # Next day of check-in or later
        check_out__gte=today # Stay has not ended yet
    )

    for booking in eligible_bookings:
        already_notified = Notification.objects.filter(
            recipient=user,
            booking=booking,
            notification_type=Notification.TYPE_STAY_REMINDER
        ).exists()

        if not already_notified:
            hotel_name = booking.hotel.name if booking.hotel else "your hotel"
            room_title = booking.room.title if booking.room else "room"
            create_notification(
                recipient=user,
                title=f"🏨 Stay Reminder: Hope you're enjoying your stay at {hotel_name}!",
                message=(
                    f"Good morning! Welcome to day 2 of your stay in {room_title} (Booking Code: {booking.booking_id}). "
                    f"If you need fresh towels, room service, or local tips, feel free to contact front desk or staff."
                ),
                notification_type=Notification.TYPE_STAY_REMINDER,
                booking=booking
            )
