from django.urls import path
from .views import (
    HotelListView, HotelDetailView, OwnerHotelListView,
    HotelSearchAPIView, HotelSubmitApprovalView, AdminHotelApprovalView,
    HotelDocumentUploadView, AmenityListView, HotelImageUploadView, HotelCitiesView
)

urlpatterns = [
    path('', HotelListView.as_view(), name='hotel_list'),
    path('cities/', HotelCitiesView.as_view(), name='hotel_cities'),
    path('search/', HotelSearchAPIView.as_view(), name='hotel_search'),
    path('owner-hotels/', OwnerHotelListView.as_view(), name='owner_hotels'),
    path('amenities/', AmenityListView.as_view(), name='amenity_list'),
    path('<int:pk>/', HotelDetailView.as_view(), name='hotel_detail'),
    path('<int:pk>/submit/', HotelSubmitApprovalView.as_view(), name='hotel_submit'),
    path('<int:pk>/approve/', AdminHotelApprovalView.as_view(), name='hotel_approve'),
    path('<int:pk>/approval/', AdminHotelApprovalView.as_view(), name='hotel_approval'),
    path('<int:pk>/documents/', HotelDocumentUploadView.as_view(), name='hotel_document_upload'),
    path('<int:pk>/upload-image/', HotelImageUploadView.as_view(), name='hotel_image_upload'),
]

