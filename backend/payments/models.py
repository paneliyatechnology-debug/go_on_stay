import uuid
from django.db import models
from django.conf import settings
from bookings.models import Booking

class Payment(models.Model):
    STATUS_CREATED = 'CREATED'
    STATUS_PENDING = 'PENDING'
    STATUS_AUTHORIZED = 'AUTHORIZED'
    STATUS_CAPTURED = 'CAPTURED'
    STATUS_FAILED = 'FAILED'
    STATUS_REFUND_PENDING = 'REFUND_PENDING'
    STATUS_PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED'
    STATUS_REFUNDED = 'REFUNDED'

    PAYMENT_STATUS_CHOICES = (
        (STATUS_CREATED, 'Created'),
        (STATUS_PENDING, 'Pending'),
        (STATUS_AUTHORIZED, 'Authorized'),
        (STATUS_CAPTURED, 'Captured'),
        (STATUS_FAILED, 'Failed'),
        (STATUS_REFUND_PENDING, 'Refund Pending'),
        (STATUS_PARTIALLY_REFUNDED, 'Partially Refunded'),
        (STATUS_REFUNDED, 'Refunded'),
    )

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='payments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    
    razorpay_order_id = models.CharField(max_length=100, db_index=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True, unique=True, db_index=True)
    razorpay_signature = models.TextField(blank=True, null=True)
    
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')
    
    status = models.CharField(max_length=30, choices=PAYMENT_STATUS_CHOICES, default=STATUS_CREATED, db_index=True)
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    failure_reason = models.TextField(blank=True, null=True)
    error_code = models.CharField(max_length=100, blank=True, null=True)
    
    paid_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment {self.razorpay_order_id} - {self.status} (₹{self.amount})"


class Refund(models.Model):
    STATUS_PENDING = 'PENDING'
    STATUS_PROCESSED = 'PROCESSED'
    STATUS_FAILED = 'FAILED'

    REFUND_STATUS_CHOICES = (
        (STATUS_PENDING, 'Pending'),
        (STATUS_PROCESSED, 'Processed'),
        (STATUS_FAILED, 'Failed'),
    )

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='refunds')
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='refunds')
    
    razorpay_payment_id = models.CharField(max_length=100)
    razorpay_refund_id = models.CharField(max_length=100, unique=True, db_index=True)
    
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')
    reason = models.TextField(blank=True, null=True)
    
    status = models.CharField(max_length=30, choices=REFUND_STATUS_CHOICES, default=STATUS_PENDING)
    
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Refund {self.razorpay_refund_id} - ₹{self.amount} ({self.status})"


class WebhookEvent(models.Model):
    event_id = models.CharField(max_length=100, unique=True, db_index=True)
    event_type = models.CharField(max_length=100)
    payload = models.JSONField()
    processed = models.BooleanField(default=False)
    processed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Webhook {self.event_id} ({self.event_type})"


class HostEarning(models.Model):
    STATUS_PENDING = 'PENDING'
    STATUS_AVAILABLE = 'AVAILABLE'
    STATUS_PAID = 'PAID'
    STATUS_REVERSED = 'REVERSED'

    HOST_EARNING_STATUS_CHOICES = (
        (STATUS_PENDING, 'Pending'),
        (STATUS_AVAILABLE, 'Available'),
        (STATUS_PAID, 'Paid'),
        (STATUS_REVERSED, 'Reversed'),
    )

    host = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='host_earnings')
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='host_earning')
    
    gross_amount = models.DecimalField(max_digits=12, decimal_places=2)
    platform_fee = models.DecimalField(max_digits=12, decimal_places=2)  # e.g., 10% commission
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    refund_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    net_amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    status = models.CharField(max_length=30, choices=HOST_EARNING_STATUS_CHOICES, default=STATUS_PENDING)
    available_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"HostEarning {self.host.username} - Booking {self.booking.booking_id} (Net: ₹{self.net_amount})"


class HostPayout(models.Model):
    STATUS_PENDING = 'PENDING'
    STATUS_PROCESSING = 'PROCESSING'
    STATUS_COMPLETED = 'COMPLETED'
    STATUS_FAILED = 'FAILED'

    PAYOUT_STATUS_CHOICES = (
        (STATUS_PENDING, 'Pending Approval'),
        (STATUS_PROCESSING, 'Processing Transfer'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_FAILED, 'Failed'),
    )

    payout_id = models.CharField(max_length=50, unique=True, db_index=True)
    host = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payouts')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')
    status = models.CharField(max_length=30, choices=PAYOUT_STATUS_CHOICES, default=STATUS_PENDING)
    bank_reference = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.payout_id:
            self.payout_id = f"PO-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Payout {self.payout_id} - {self.host.username} (₹{self.amount})"


class PlatformSetting(models.Model):
    commission_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)
    gst_tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)
    default_currency = models.CharField(max_length=10, default='INR')
    support_email = models.EmailField(default='support@bookmyroom.com')
    support_phone = models.CharField(max_length=20, default='+91 98765 43210')
    is_maintenance_mode = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Platform Settings (Commission: {self.commission_percentage}%, GST: {self.gst_tax_percentage}%)"


class SupportTicket(models.Model):
    CATEGORY_CHOICES = (
        ('BOOKING', 'Booking Inquiry'),
        ('PAYMENT', 'Payment Issue'),
        ('REFUND', 'Refund Request'),
        ('HOTEL', 'Hotel Property Info'),
        ('CANCELLATION', 'Cancellation'),
        ('ACCOUNT', 'Account Settings'),
        ('TECHNICAL', 'Technical Bug'),
    )

    PRIORITY_CHOICES = (
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    )

    STATUS_CHOICES = (
        ('OPEN', 'Open'),
        ('IN_PROGRESS', 'In Progress'),
        ('WAITING_FOR_USER', 'Waiting for Customer'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED', 'Closed'),
    )

    ticket_number = models.CharField(max_length=50, unique=True, db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='support_tickets')
    booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, blank=True, null=True, related_name='support_tickets')
    
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='BOOKING')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='OPEN')
    
    subject = models.CharField(max_length=255)
    description = models.TextField()
    
    assigned_agent = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True, related_name='assigned_tickets')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.ticket_number:
            self.ticket_number = f"TICK-{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Ticket {self.ticket_number} - {self.subject} ({self.status})"


class TicketMessage(models.Model):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    message = models.TextField()
    attachment_url = models.URLField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message on {self.ticket.ticket_number} by {self.sender.username}"


class CustomerHotelMessage(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='chat_messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_chat_messages')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_chat_messages')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Chat on Booking {self.booking.booking_id} from {self.sender.username}"


class AuditLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True)
    action = models.CharField(max_length=150)
    entity_type = models.CharField(max_length=100)
    entity_id = models.CharField(max_length=100, blank=True, null=True)
    old_values = models.JSONField(blank=True, null=True)
    new_values = models.JSONField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"AuditLog {self.action} on {self.entity_type} by {self.user}"
