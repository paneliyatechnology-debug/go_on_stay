from django.db import models
from hotels.models import Hotel, Amenity

class Room(models.Model):
    ROOM_TYPES = (
        ('STANDARD', 'Standard Room'),
        ('DELUXE', 'Deluxe Room'),
        ('SUPER_DELUXE', 'Super Deluxe Room'),
        ('EXECUTIVE', 'Executive Suite'),
        ('FAMILY', 'Family Suite'),
        ('PRESIDENTIAL', 'Presidential Suite'),
        ('VILLA', 'Private Villa'),
    )

    MEAL_PLAN_ROOM_ONLY = 'ROOM_ONLY'
    MEAL_PLAN_BREAKFAST = 'BREAKFAST'
    MEAL_PLAN_HALF_BOARD = 'HALF_BOARD'
    MEAL_PLAN_FULL_BOARD = 'FULL_BOARD'

    MEAL_PLAN_CHOICES = (
        (MEAL_PLAN_ROOM_ONLY, 'Room Only (No Meals)'),
        (MEAL_PLAN_BREAKFAST, 'Breakfast Included'),
        (MEAL_PLAN_HALF_BOARD, 'Half Board (Breakfast + Dinner)'),
        (MEAL_PLAN_FULL_BOARD, 'Full Board (All Meals Included)'),
    )

    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='rooms')
    room_type = models.CharField(max_length=30, choices=ROOM_TYPES, default='DELUXE')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    weekend_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    seasonal_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    extra_guest_price = models.DecimalField(max_digits=10, decimal_places=2, default=500.00)
    child_price = models.DecimalField(max_digits=10, decimal_places=2, default=250.00)

    capacity_adults = models.IntegerField(default=2)
    capacity_children = models.IntegerField(default=1)
    room_size_sqft = models.IntegerField(default=350, help_text="Room area in square feet")
    
    bed_type = models.CharField(max_length=50, default='King Bed')
    number_of_beds = models.IntegerField(default=1)
    
    meal_plan = models.CharField(max_length=30, choices=MEAL_PLAN_CHOICES, default=MEAL_PLAN_BREAKFAST)
    breakfast_included = models.BooleanField(default=True)
    free_cancellation = models.BooleanField(default=True)
    
    total_rooms = models.IntegerField(default=5, help_text="Total number of physical rooms of this category in the hotel")
    room_numbers = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Comma-separated room numbers e.g. 101, 102, 103, 104, 105 or Villa-1, Villa-2"
    )
    
    amenities = models.ManyToManyField(Amenity, related_name='rooms', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_all_room_numbers(self):
        if self.room_numbers and self.room_numbers.strip():
            return [r.strip() for r in self.room_numbers.split(',') if r.strip()]
        prefix = "Villa" if "VILLA" in self.room_type.upper() or "VILLA" in self.title.upper() else "Room"
        return [f"{prefix} {101 + i}" for i in range(max(1, self.total_rooms))]

    def get_price_for_date(self, target_date):
        # 1. Date specific override check
        cal_override = self.calendar_blocks.filter(date=target_date).first()
        if cal_override and cal_override.custom_price:
            return cal_override.custom_price

        # 2. Seasonal price check (if configured)
        if self.seasonal_price:
            return self.seasonal_price

        # 3. Weekend price check (Friday = 4, Saturday = 5)
        if target_date.weekday() in [4, 5] and self.weekend_price:
            return self.weekend_price

        # 4. Base price fallback
        return self.price_per_night

    def __str__(self):
        return f"{self.title} - {self.hotel.name} (₹{self.price_per_night}/night)"

class RoomImage(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='images')
    image_url = models.URLField(max_length=500, blank=True, null=True)
    image = models.ImageField(upload_to='rooms/images/', blank=True, null=True)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def get_image_display(self):
        if self.image:
            return self.image.url
        return self.image_url or ''

    def __str__(self):
        return f"Image for {self.room.title}"

class RoomCalendarBlock(models.Model):
    REASON_MAINTENANCE = 'MAINTENANCE'
    REASON_CLOSED = 'CLOSED'
    REASON_PRIVATE = 'PRIVATE_BOOKING'
    REASON_OWNER_BLOCK = 'OWNER_BLOCK'

    REASON_CHOICES = (
        (REASON_MAINTENANCE, 'Maintenance Work'),
        (REASON_CLOSED, 'Hotel Closed'),
        (REASON_PRIVATE, 'Private Off-platform Booking'),
        (REASON_OWNER_BLOCK, 'Owner Block'),
    )

    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='calendar_blocks')
    date = models.DateField(db_index=True)
    custom_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    is_blocked = models.BooleanField(default=False)
    block_reason = models.CharField(max_length=30, choices=REASON_CHOICES, default=REASON_OWNER_BLOCK)

    class Meta:
        unique_together = ('room', 'date')
        ordering = ['date']

    def __str__(self):
        return f"Calendar {self.room.title} on {self.date} (Blocked: {self.is_blocked})"
