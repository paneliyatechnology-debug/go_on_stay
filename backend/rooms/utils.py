from django.db.models import Sum
from django.utils import timezone
from bookings.models import Booking


def auto_update_past_checkout_bookings():
    """
    Automatically updates any booking whose check_out date is past today
    from CONFIRMED or CHECKED_IN to CHECKED_OUT, restoring room availability.
    """
    try:
        today = timezone.now().date()
        Booking.objects.filter(
            booking_status__in=[Booking.STATUS_CONFIRMED, Booking.STATUS_CHECKED_IN],
            check_out__lt=today
        ).update(
            booking_status=Booking.STATUS_CHECKED_OUT,
            actual_check_out_at=timezone.now()
        )
    except Exception as e:
        print(f"[AutoCheckout] Error updating past checkout bookings: {e}")


def get_available_room_count(room, check_in_date, check_out_date):
    """
    Calculates remaining physical rooms available for a given date range.

    RULE: Only CONFIRMED and CHECKED_IN bookings count as "reserved".
    PENDING_PAYMENT bookings do NOT block room availability — a room is only
    truly reserved after the customer completes payment successfully.

    Two date ranges overlap if:
    existing_check_in < requested_check_out AND existing_check_out > requested_check_in
    """
    # Auto-release rooms for past checkouts
    auto_update_past_checkout_bookings()

    if not check_in_date or not check_out_date:
        return room.total_rooms

    # Only count CONFIRMED and CHECKED_IN — NOT PENDING_PAYMENT
    overlapping_bookings = Booking.objects.filter(
        room=room,
        booking_status__in=[
            Booking.STATUS_CONFIRMED,
            Booking.STATUS_CHECKED_IN,
        ],
        check_in__lt=check_out_date,
        check_out__gt=check_in_date
    )

    booked_rooms_count = overlapping_bookings.aggregate(
        Sum('number_of_rooms')
    )['number_of_rooms__sum'] or 0

    available_count = max(0, room.total_rooms - booked_rooms_count)
    return available_count
