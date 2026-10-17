from rest_framework import serializers
from .models import (
    Payment, Refund, WebhookEvent, HostEarning,
    HostPayout, PlatformSetting, SupportTicket, TicketMessage,
    CustomerHotelMessage, AuditLog
)
from bookings.models import Booking
from users.serializers import UserSerializer

class PaymentSerializer(serializers.ModelSerializer):
    booking_id = serializers.CharField(source='booking.booking_id', read_only=True)
    customer_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    hotel_name = serializers.CharField(source='booking.hotel.name', read_only=True)
    host_name = serializers.CharField(source='booking.hotel.owner.get_full_name', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'booking', 'booking_id', 'user', 'customer_name', 'user_email',
            'hotel_name', 'host_name', 'razorpay_order_id',
            'razorpay_payment_id', 'amount', 'currency', 'status',
            'payment_method', 'failure_reason', 'error_code',
            'paid_at', 'created_at', 'updated_at'
        ]
        read_only_fields = fields


class RefundSerializer(serializers.ModelSerializer):
    booking_id = serializers.CharField(source='booking.booking_id', read_only=True)

    class Meta:
        model = Refund
        fields = [
            'id', 'booking', 'booking_id', 'payment', 'razorpay_payment_id',
            'razorpay_refund_id', 'amount', 'currency', 'reason',
            'status', 'created_at', 'processed_at'
        ]
        read_only_fields = fields


class WebhookEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebhookEvent
        fields = ['id', 'event_id', 'event_type', 'payload', 'processed', 'processed_at', 'created_at']
        read_only_fields = fields


class HostEarningSerializer(serializers.ModelSerializer):
    booking_id = serializers.CharField(source='booking.booking_id', read_only=True)
    hotel_name = serializers.CharField(source='booking.hotel.name', read_only=True)

    class Meta:
        model = HostEarning
        fields = [
            'id', 'host', 'booking', 'booking_id', 'hotel_name',
            'gross_amount', 'platform_fee', 'tax', 'refund_amount',
            'net_amount', 'status', 'available_at', 'created_at'
        ]
        read_only_fields = fields


class HostPayoutSerializer(serializers.ModelSerializer):
    host_name = serializers.CharField(source='host.get_full_name', read_only=True)

    class Meta:
        model = HostPayout
        fields = ['id', 'payout_id', 'host', 'host_name', 'amount', 'currency', 'status', 'bank_reference', 'notes', 'created_at', 'processed_at']
        read_only_fields = ['id', 'payout_id', 'created_at']


class PlatformSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSetting
        fields = ['id', 'commission_percentage', 'gst_tax_percentage', 'default_currency', 'support_email', 'support_phone', 'is_maintenance_mode', 'updated_at']


class TicketMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)

    class Meta:
        model = TicketMessage
        fields = ['id', 'ticket', 'sender', 'sender_name', 'sender_role', 'message', 'attachment_url', 'created_at']
        read_only_fields = ['id', 'sender', 'created_at']


class SupportTicketSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    assigned_agent_name = serializers.CharField(source='assigned_agent.get_full_name', read_only=True)
    messages = TicketMessageSerializer(many=True, read_only=True)

    class Meta:
        model = SupportTicket
        fields = [
            'id', 'ticket_number', 'user', 'user_name', 'booking', 'category',
            'priority', 'status', 'subject', 'description', 'assigned_agent',
            'assigned_agent_name', 'messages', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'ticket_number', 'user', 'created_at', 'updated_at']


class CustomerHotelMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    receiver_name = serializers.CharField(source='receiver.get_full_name', read_only=True)

    class Meta:
        model = CustomerHotelMessage
        fields = ['id', 'booking', 'sender', 'sender_name', 'receiver', 'receiver_name', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'sender', 'created_at']


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'user_name', 'action', 'entity_type', 'entity_id', 'old_values', 'new_values', 'ip_address', 'created_at']
        read_only_fields = fields


class PaymentOrderCreateSerializer(serializers.Serializer):
    booking_id = serializers.CharField(required=True)


class PaymentVerifySerializer(serializers.Serializer):
    booking_id = serializers.CharField(required=True)
    razorpay_order_id = serializers.CharField(required=True)
    razorpay_payment_id = serializers.CharField(required=True)
    razorpay_signature = serializers.CharField(required=True)


class PaymentRetrySerializer(serializers.Serializer):
    booking_id = serializers.CharField(required=True)


class RefundCreateSerializer(serializers.Serializer):
    booking_id = serializers.CharField(required=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    reason = serializers.CharField(required=False, default="Requested customer refund")
