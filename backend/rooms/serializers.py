from rest_framework import serializers
from .models import Room, RoomImage, RoomCalendarBlock
from hotels.serializers import AmenitySerializer
from .utils import get_available_room_count

class RoomImageSerializer(serializers.ModelSerializer):
    display_url = serializers.SerializerMethodField()

    class Meta:
        model = RoomImage
        fields = ('id', 'image', 'image_url', 'display_url', 'is_primary')

    def get_display_url(self, obj):
        return obj.get_image_display()

class RoomCalendarBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomCalendarBlock
        fields = ('id', 'room', 'date', 'custom_price', 'is_blocked', 'block_reason')

class RoomSerializer(serializers.ModelSerializer):
    images = RoomImageSerializer(many=True, read_only=True)
    amenities = AmenitySerializer(many=True, read_only=True)
    hotel_name = serializers.CharField(source='hotel.name', read_only=True)
    hotel_city = serializers.CharField(source='hotel.city', read_only=True)
    primary_image = serializers.SerializerMethodField()
    available_count = serializers.SerializerMethodField()
    all_room_numbers = serializers.SerializerMethodField()
    calendar_blocks = RoomCalendarBlockSerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = (
            'id', 'hotel', 'hotel_name', 'hotel_city', 'room_type', 'meal_plan',
            'title', 'description', 'price_per_night', 'weekend_price', 'seasonal_price',
            'extra_guest_price', 'child_price', 'capacity_adults', 'capacity_children',
            'room_size_sqft', 'bed_type', 'number_of_beds', 'breakfast_included',
            'free_cancellation', 'total_rooms', 'room_numbers', 'all_room_numbers',
            'available_count', 'amenities', 'images', 'primary_image', 'calendar_blocks',
            'created_at', 'updated_at'
        )

    def get_primary_image(self, obj):
        primary = obj.images.filter(is_primary=True).first() or obj.images.first()
        if primary:
            return primary.get_image_display()
        return "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80"

    def get_available_count(self, obj):
        check_in = self.context.get('check_in')
        check_out = self.context.get('check_out')
        return get_available_room_count(obj, check_in, check_out)

    def get_all_room_numbers(self, obj):
        return obj.get_all_room_numbers()

class RoomCreateUpdateSerializer(serializers.ModelSerializer):
    amenity_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )

    class Meta:
        model = Room
        fields = (
            'hotel', 'room_type', 'meal_plan', 'title', 'description',
            'price_per_night', 'weekend_price', 'seasonal_price',
            'extra_guest_price', 'child_price', 'capacity_adults',
            'capacity_children', 'room_size_sqft', 'bed_type', 'number_of_beds',
            'breakfast_included', 'free_cancellation', 'total_rooms',
            'room_numbers', 'amenity_ids'
        )
        extra_kwargs = {
            'room_type': {'required': False},
            'meal_plan': {'required': False},
            'description': {'required': False, 'allow_blank': True, 'allow_null': True},
            'weekend_price': {'required': False, 'allow_null': True},
            'seasonal_price': {'required': False, 'allow_null': True},
            'extra_guest_price': {'required': False},
            'child_price': {'required': False},
            'capacity_adults': {'required': False},
            'capacity_children': {'required': False},
            'room_size_sqft': {'required': False},
            'bed_type': {'required': False},
            'number_of_beds': {'required': False},
            'breakfast_included': {'required': False},
            'free_cancellation': {'required': False},
            'total_rooms': {'required': False},
            'room_numbers': {'required': False, 'allow_blank': True, 'allow_null': True},
        }

    def create(self, validated_data):
        amenity_ids = validated_data.pop('amenity_ids', [])
        room = Room.objects.create(**validated_data)
        if amenity_ids:
            room.amenities.set(amenity_ids)
        return room

    def update(self, instance, validated_data):
        amenity_ids = validated_data.pop('amenity_ids', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if amenity_ids is not None:
            instance.amenities.set(amenity_ids)
        return instance
