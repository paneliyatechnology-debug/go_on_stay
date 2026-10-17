from rest_framework import serializers
from .models import Hotel, HotelImage, Amenity, HotelVerificationDocument, HotelStaff
from django.db.models import Min
from users.serializers import UserSerializer

class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = ('id', 'name', 'icon_name', 'category')

class HotelImageSerializer(serializers.ModelSerializer):
    display_url = serializers.SerializerMethodField()

    class Meta:
        model = HotelImage
        fields = ('id', 'image', 'image_url', 'display_url', 'caption', 'is_primary')

    def get_display_url(self, obj):
        return obj.get_image_display()

class HotelVerificationDocumentSerializer(serializers.ModelSerializer):
    document_display_type = serializers.CharField(source='get_document_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = HotelVerificationDocument
        fields = ('id', 'hotel', 'document_type', 'document_display_type', 'document_url', 'document_file', 'status', 'status_display', 'rejection_reason', 'created_at')
        read_only_fields = ('id', 'created_at')

class HotelStaffSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)

    class Meta:
        model = HotelStaff
        fields = ('id', 'hotel', 'user', 'user_details', 'role_title', 'can_manage_bookings', 'can_manage_rooms', 'can_checkin_checkout', 'created_at')
        read_only_fields = ('id', 'created_at')

class HotelSerializer(serializers.ModelSerializer):
    images = HotelImageSerializer(many=True, read_only=True)
    amenities = AmenitySerializer(many=True, read_only=True)
    owner_name = serializers.SerializerMethodField()
    owner_email = serializers.SerializerMethodField()
    owner_phone = serializers.SerializerMethodField()
    starting_price = serializers.SerializerMethodField()
    primary_image = serializers.SerializerMethodField()
    verification_documents = HotelVerificationDocumentSerializer(many=True, read_only=True)
    guest_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()

    class Meta:
        model = Hotel
        fields = (
            'id', 'owner', 'owner_name', 'owner_email', 'owner_phone', 'name', 'description', 'property_type',
            'address', 'city', 'state', 'zip_code', 'country', 'area', 'landmark',
            'destination', 'latitude', 'longitude', 'star_rating', 'guest_rating', 'reviews_count',
            'check_in_time', 'check_out_time', 'rules', 'cancellation_policy',
            'child_policy', 'pet_policy', 'smoking_policy', 'payment_policy',
            'safety_info', 'nearby_attractions', 'status', 'rejection_reason',
            'amenities', 'images', 'starting_price', 'primary_image', 'is_approved',
            'verification_documents', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'owner', 'created_at', 'updated_at')

    def get_guest_rating(self, obj):
        from django.db.models import Avg
        avg_val = obj.reviews.filter(status='VISIBLE').aggregate(Avg('rating'))['rating__avg']
        if avg_val is not None:
            return round(float(avg_val), 1)
        return None

    def get_reviews_count(self, obj):
        return obj.reviews.filter(status='VISIBLE').count()

    def get_owner_name(self, obj):
        if not obj.owner:
            return "N/A"
        full_name = obj.owner.get_full_name().strip()
        if full_name:
            return full_name
        return obj.owner.first_name or obj.owner.username or f"Owner #{obj.owner.id}"

    def get_owner_email(self, obj):
        return obj.owner.email if obj.owner else ""

    def get_owner_phone(self, obj):
        return obj.owner.phone_number if obj.owner else ""

    def get_starting_price(self, obj):
        min_price = obj.rooms.aggregate(Min('price_per_night'))['price_per_night__min']
        return min_price or 2500.00

    def get_primary_image(self, obj):
        primary = obj.images.filter(is_primary=True).first() or obj.images.first()
        if primary:
            return primary.get_image_display()
        
        DEFAULT_HOTEL_IMAGES = [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
        ]
        img_idx = (obj.id or 0) % len(DEFAULT_HOTEL_IMAGES)
        return DEFAULT_HOTEL_IMAGES[img_idx]

class HotelCreateUpdateSerializer(serializers.ModelSerializer):
    amenity_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )

    class Meta:
        model = Hotel
        fields = (
            'name', 'description', 'property_type', 'address', 'city', 'state',
            'zip_code', 'country', 'area', 'landmark', 'destination',
            'latitude', 'longitude', 'star_rating', 'check_in_time', 'check_out_time',
            'rules', 'cancellation_policy', 'child_policy', 'pet_policy',
            'smoking_policy', 'payment_policy', 'safety_info', 'nearby_attractions',
            'amenity_ids', 'status',
        )
        extra_kwargs = {
            'property_type': {'required': False},
            'zip_code': {'required': False, 'allow_blank': True, 'allow_null': True},
            'country': {'required': False},
            'area': {'required': False, 'allow_blank': True, 'allow_null': True},
            'landmark': {'required': False, 'allow_blank': True, 'allow_null': True},
            'destination': {'required': False, 'allow_blank': True, 'allow_null': True},
            'latitude': {'required': False},
            'longitude': {'required': False},
            'star_rating': {'required': False},
            'check_in_time': {'required': False},
            'check_out_time': {'required': False},
            'rules': {'required': False, 'allow_blank': True, 'allow_null': True},
            'cancellation_policy': {'required': False, 'allow_blank': True, 'allow_null': True},
            'child_policy': {'required': False, 'allow_blank': True, 'allow_null': True},
            'pet_policy': {'required': False, 'allow_blank': True, 'allow_null': True},
            'smoking_policy': {'required': False, 'allow_blank': True, 'allow_null': True},
            'payment_policy': {'required': False, 'allow_blank': True, 'allow_null': True},
            'safety_info': {'required': False, 'allow_blank': True, 'allow_null': True},
            'nearby_attractions': {'required': False, 'allow_blank': True, 'allow_null': True},
            'status': {'required': False},
        }

    def create(self, validated_data):
        amenity_ids = validated_data.pop('amenity_ids', [])
        hotel = Hotel.objects.create(**validated_data)
        if amenity_ids:
            hotel.amenities.set(amenity_ids)
        return hotel

    def update(self, instance, validated_data):
        amenity_ids = validated_data.pop('amenity_ids', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if amenity_ids is not None:
            instance.amenities.set(amenity_ids)
        return instance
