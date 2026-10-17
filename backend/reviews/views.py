from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.db.models import Avg
from decimal import Decimal
from .models import Review
from .serializers import ReviewSerializer
from bookings.models import Booking

def update_hotel_guest_rating(hotel):
    if not hotel:
        return
    visible_reviews = hotel.reviews.filter(status=Review.STATUS_VISIBLE)
    count = visible_reviews.count()
    if count > 0:
        avg = visible_reviews.aggregate(Avg('rating'))['rating__avg']
        hotel.guest_rating = Decimal(str(round(float(avg), 1)))
    else:
        hotel.guest_rating = Decimal('5.0')
    hotel.save(update_fields=['guest_rating'])

class ReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        hotel_id = self.request.query_params.get('hotel_id')
        if hotel_id:
            return Review.objects.filter(hotel_id=hotel_id, status=Review.STATUS_VISIBLE).order_by('-created_at')
        return Review.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        booking_lookup = self.request.data.get('booking')
        booking = None

        if str(booking_lookup).isdigit():
            booking = Booking.objects.filter(id=int(booking_lookup), customer=self.request.user).first()
        
        if not booking:
            booking = Booking.objects.filter(booking_id=str(booking_lookup), customer=self.request.user).first()

        if not booking:
            raise permissions.PermissionDenied("You can only review hotels where you have a valid reservation under your account.")

        if hasattr(booking, 'review') or Review.objects.filter(booking=booking).exists():
            raise permissions.PermissionDenied("You have already submitted a rating for this stay.")

        review = serializer.save(user=self.request.user, hotel=booking.hotel, booking=booking)
        update_hotel_guest_rating(booking.hotel)


class ReviewDetailView(generics.RetrieveDestroyAPIView):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_destroy(self, instance):
        hotel = instance.hotel
        instance.delete()
        update_hotel_guest_rating(hotel)
