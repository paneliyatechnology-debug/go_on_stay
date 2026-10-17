from rest_framework import serializers
from .models import Wishlist
from hotels.serializers import HotelSerializer

class WishlistSerializer(serializers.ModelSerializer):
    hotel_details = HotelSerializer(source='hotel', read_only=True)

    class Meta:
        model = Wishlist
        fields = ('id', 'user', 'hotel', 'hotel_details', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')
