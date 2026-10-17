from django.urls import path
from .views import (
    BookingListCreateView, BookingDetailView, BookingCancelView,
    StaffCheckInView, StaffCheckOutView, StaffNoShowView
)

urlpatterns = [
    path('', BookingListCreateView.as_view(), name='booking_list_create'),
    path('<str:pk>/', BookingDetailView.as_view(), name='booking_detail'),
    path('<str:pk>/cancel/', BookingCancelView.as_view(), name='booking_cancel'),
    path('<str:pk>/check-in/', StaffCheckInView.as_view(), name='booking_check_in'),
    path('<str:pk>/check-out/', StaffCheckOutView.as_view(), name='booking_check_out'),
    path('<str:pk>/no-show/', StaffNoShowView.as_view(), name='booking_no_show'),
]
