from django.db import models
from django.conf import settings
from hotels.models import Hotel
from bookings.models import Booking

class Review(models.Model):
    STATUS_VISIBLE = 'VISIBLE'
    STATUS_HIDDEN = 'HIDDEN'
    STATUS_FLAGGED = 'FLAGGED'

    STATUS_CHOICES = (
        (STATUS_VISIBLE, 'Visible'),
        (STATUS_HIDDEN, 'Hidden by Admin'),
        (STATUS_FLAGGED, 'Flagged for Review'),
    )

    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='review')
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    
    rating = models.IntegerField(default=5) # Overall rating
    rating_cleanliness = models.DecimalField(max_digits=3, decimal_places=1, default=5.0)
    rating_location = models.DecimalField(max_digits=3, decimal_places=1, default=5.0)
    rating_service = models.DecimalField(max_digits=3, decimal_places=1, default=5.0)
    rating_facilities = models.DecimalField(max_digits=3, decimal_places=1, default=5.0)
    rating_value = models.DecimalField(max_digits=3, decimal_places=1, default=5.0)
    
    comment = models.TextField()
    photo_url = models.URLField(max_length=500, blank=True, null=True)
    
    owner_response = models.TextField(blank=True, null=True)
    owner_responded_at = models.DateTimeField(blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_VISIBLE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Review by {self.user.username} for {self.hotel.name} ({self.rating}★)"
