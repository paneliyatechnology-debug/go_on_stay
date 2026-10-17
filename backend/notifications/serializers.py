from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    booking_id = serializers.CharField(source='booking.booking_id', read_only=True)
    hotel_name = serializers.CharField(source='booking.hotel.name', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'booking', 'booking_id', 'hotel_name',
            'title', 'message', 'notification_type', 'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'recipient', 'created_at']
