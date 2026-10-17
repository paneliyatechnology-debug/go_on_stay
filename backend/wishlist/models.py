from django.db import models
from django.conf import settings
from hotels.models import Hotel

class Wishlist(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wishlist_items')
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'hotel')

    def __str__(self):
        return f"{self.user.username} saved {self.hotel.name}"
