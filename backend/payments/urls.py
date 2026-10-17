from django.urls import path
from .views import (
    CreateOrderView, VerifyPaymentView, WebhookView,
    RetryPaymentView, RefundView, AdminPaymentListView, AdminRefundListView,
    HostPayoutListCreateView, PlatformSettingsView, SupportTicketListCreateView,
    SupportTicketDetailView, TicketMessageCreateView, CustomerHotelChatView,
    AdminAuditLogListView, CreateHostSubscriptionOrderView, VerifyHostSubscriptionPaymentView
)

urlpatterns = [
    path('create-order/', CreateOrderView.as_view(), name='payment-create-order'),
    path('verify/', VerifyPaymentView.as_view(), name='payment-verify'),
    path('create-host-subscription-order/', CreateHostSubscriptionOrderView.as_view(), name='host-subscription-create-order'),
    path('verify-host-subscription/', VerifyHostSubscriptionPaymentView.as_view(), name='host-subscription-verify'),
    path('webhook/', WebhookView.as_view(), name='payment-webhook'),
    path('retry/', RetryPaymentView.as_view(), name='payment-retry'),
    path('refund/', RefundView.as_view(), name='payment-refund'),
    
    # Payouts & Settings
    path('payouts/', HostPayoutListCreateView.as_view(), name='host-payouts'),
    path('settings/', PlatformSettingsView.as_view(), name='platform-settings'),

    # Support Tickets & Messaging
    path('support-tickets/', SupportTicketListCreateView.as_view(), name='support-tickets'),
    path('support-tickets/<int:pk>/', SupportTicketDetailView.as_view(), name='support-ticket-detail'),
    path('support-tickets/<int:pk>/messages/', TicketMessageCreateView.as_view(), name='support-ticket-messages'),
    path('chat/<str:booking_id>/', CustomerHotelChatView.as_view(), name='customer-hotel-chat'),

    # Admin Audit Endpoints
    path('admin/all/', AdminPaymentListView.as_view(), name='admin-payment-list'),
    path('admin/refunds/', AdminRefundListView.as_view(), name='admin-refund-list'),
    path('admin/audit-logs/', AdminAuditLogListView.as_view(), name='admin-audit-logs'),
]
