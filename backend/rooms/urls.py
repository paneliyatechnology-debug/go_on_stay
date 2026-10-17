from django.urls import path
from .views import (
    RoomListView, RoomDetailView, RoomsByHotelView,
    CheckAvailabilityView, RoomImageUploadView, RoomCalendarManageView
)

urlpatterns = [
    path('', RoomListView.as_view(), name='room_list'),
    path('check-availability/', CheckAvailabilityView.as_view(), name='check_availability'),
    path('<int:pk>/', RoomDetailView.as_view(), name='room_detail'),
    path('<int:pk>/calendar/', RoomCalendarManageView.as_view(), name='room_calendar'),
    path('by-hotel/<int:hotel_id>/', RoomsByHotelView.as_view(), name='rooms_by_hotel'),
    path('<int:pk>/upload-image/', RoomImageUploadView.as_view(), name='room_image_upload'),
]
