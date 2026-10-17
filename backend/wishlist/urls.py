from django.urls import path
from .views import WishlistListView, WishlistToggleView

urlpatterns = [
    path('', WishlistListView.as_view(), name='wishlist_list'),
    path('toggle/<int:hotel_id>/', WishlistToggleView.as_view(), name='wishlist_toggle'),
]
