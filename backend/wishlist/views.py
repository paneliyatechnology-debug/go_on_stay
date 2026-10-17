from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Wishlist
from .serializers import WishlistSerializer
from hotels.models import Hotel

class WishlistListView(generics.ListAPIView):
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user).order_by('-created_at')

class WishlistToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, hotel_id):
        try:
            hotel = Hotel.objects.get(id=hotel_id)
            wishlist_item, created = Wishlist.objects.get_or_create(user=request.user, hotel=hotel)
            if not created:
                wishlist_item.delete()
                return Response({"message": f"Removed {hotel.name} from wishlist.", "is_favorited": False})
            return Response({"message": f"Saved {hotel.name} to wishlist.", "is_favorited": True}, status=status.HTTP_201_CREATED)
        except Hotel.DoesNotExist:
            return Response({"error": "Hotel not found."}, status=status.HTTP_404_NOT_FOUND)
