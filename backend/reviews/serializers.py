from rest_framework import serializers
from .models import Review

class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source='user.get_full_name', read_only=True)
    reviewer_username = serializers.CharField(source='user.username', read_only=True)
    hotel_name = serializers.CharField(source='hotel.name', read_only=True)

    class Meta:
        model = Review
        fields = ('id', 'booking', 'hotel', 'hotel_name', 'user', 'reviewer_name', 'reviewer_username', 'rating', 'comment', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')
