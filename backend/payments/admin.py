from django.contrib import admin
from .models import Payment, Refund, WebhookEvent, HostEarning

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('razorpay_order_id', 'booking', 'user', 'amount', 'currency', 'status', 'paid_at', 'created_at')
    list_filter = ('status', 'currency', 'created_at')
    search_fields = ('razorpay_order_id', 'razorpay_payment_id', 'booking__booking_id', 'user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = ('razorpay_refund_id', 'booking', 'payment', 'amount', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('razorpay_refund_id', 'razorpay_payment_id', 'booking__booking_id')
    readonly_fields = ('created_at',)

@admin.register(WebhookEvent)
class WebhookEventAdmin(admin.ModelAdmin):
    list_display = ('event_id', 'event_type', 'processed', 'processed_at', 'created_at')
    list_filter = ('processed', 'event_type', 'created_at')
    search_fields = ('event_id', 'event_type')
    readonly_fields = ('created_at',)

@admin.register(HostEarning)
class HostEarningAdmin(admin.ModelAdmin):
    list_display = ('host', 'booking', 'gross_amount', 'platform_fee', 'net_amount', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('host__username', 'booking__booking_id')
    readonly_fields = ('created_at',)
