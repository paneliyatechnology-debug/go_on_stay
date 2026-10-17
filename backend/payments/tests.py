import json
import hmac
import hashlib
from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.conf import settings
from django.utils import timezone
from hotels.models import Hotel
from rooms.models import Room
from bookings.models import Booking
from payments.models import Payment, Refund, WebhookEvent, HostEarning

User = get_user_model()

class RazorpayPaymentSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Test Users
        self.customer = User.objects.create_user(
            username='test_customer',
            email='customer@example.com',
            password='CustomerPassword123!',
            role='CUSTOMER',
            first_name='Test',
            last_name='Customer'
        )
        
        self.owner = User.objects.create_user(
            username='test_owner',
            email='owner@example.com',
            password='OwnerPassword123!',
            role='HOTEL_OWNER',
            first_name='Test',
            last_name='Owner'
        )
        
        self.admin = User.objects.create_user(
            username='test_admin',
            email='admin@example.com',
            password='AdminPassword123!',
            role='ADMIN',
            is_staff=True,
            is_superuser=True
        )
        
        # Test Hotel & Room
        self.hotel = Hotel.objects.create(
            owner=self.owner,
            name="Seaside Luxury Resort",
            city="Goa",
            address="Candolim Beach",
            state="Goa",
            star_rating=5
        )
        
        self.room = Room.objects.create(
            hotel=self.hotel,
            title="Ocean View Deluxe Suite",
            room_type="DELUXE",
            price_per_night=Decimal('5000.00'),
            capacity_adults=2,
            capacity_children=1,
            total_rooms=5
        )
        
        # Test Booking
        self.booking = Booking.objects.create(
            customer=self.customer,
            hotel=self.hotel,
            room=self.room,
            check_in=timezone.now().date(),
            check_out=(timezone.now() + timezone.timedelta(days=2)).date(),
            number_of_guests=2,
            number_of_rooms=1,
            price_per_night=Decimal('5000.00'),
            number_of_nights=2,
            subtotal=Decimal('10000.00'),
            taxes=Decimal('1800.00'),
            total_amount=Decimal('11800.00'),
            booking_status=Booking.STATUS_PENDING_PAYMENT,
            payment_status=Booking.PAYMENT_PENDING,
            guest_name="Test Customer",
            guest_email="customer@example.com",
            guest_phone="9876543210"
        )
        
        # JWT Token login headers
        self.client.force_authenticate(user=self.customer)

    def test_1_create_order_authenticated_customer(self):
        """Verify order creation recalculates price on server and returns valid order_id."""
        response = self.client.post('/api/payments/create-order/', {
            'booking_id': self.booking.booking_id
        }, content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('order_id', data)
        self.assertEqual(data['amount'], 1180000)  # ₹11,800.00 * 100 paise
        self.assertEqual(data['currency'], 'INR')
        self.assertEqual(data['key_id'], settings.RAZORPAY_KEY_ID)

    def test_2_order_creation_price_tamper_prevention(self):
        """Ensure backend ignores any frontend price tampering and enforces server calculation."""
        # Attempting to tamper booking amount in database before order
        self.booking.subtotal = Decimal('100.00')
        self.booking.total_amount = Decimal('100.00')
        self.booking.save()
        
        response = self.client.post('/api/payments/create-order/', {
            'booking_id': self.booking.booking_id
        }, content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Server recalculates 5000 * 2 nights = 10000 + 1800 tax = 11800 => 1180000 paise
        self.assertEqual(data['amount'], 1180000)

    def test_3_verify_payment_invalid_signature_rejection(self):
        """Security Test: Invalid HMAC signature must be rejected and logged."""
        response = self.client.post('/api/payments/verify/', {
            'booking_id': self.booking.booking_id,
            'razorpay_order_id': 'order_fake_123',
            'razorpay_payment_id': 'pay_fake_456',
            'razorpay_signature': 'invalid_forged_signature_hash'
        }, content_type='application/json')
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.json())
        self.booking.refresh_from_db()
        self.assertNotEqual(self.booking.booking_status, Booking.STATUS_CONFIRMED)

    def test_4_webhook_signature_verification(self):
        """Verify Webhook raw body HMAC SHA256 verification."""
        payload = {
            "event": "payment.failed",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_test_failed_001",
                        "order_id": "order_test_999",
                        "amount": 1180000,
                        "error_description": "Payment timed out"
                    }
                }
            }
        }
        body_bytes = json.dumps(payload).encode('utf-8')
        signature = hmac.new(
            settings.RAZORPAY_WEBHOOK_SECRET.encode('utf-8'),
            body_bytes,
            hashlib.sha256
        ).hexdigest()
        
        response = self.client.post('/api/payments/webhook/', data=body_bytes, content_type='application/json', HTTP_X_RAZORPAY_SIGNATURE=signature)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['status'], 'success')

    def test_5_payment_retry_flow(self):
        """Verify payment retry creates new order for unpaid pending booking."""
        response = self.client.post('/api/payments/retry/', {
            'booking_id': self.booking.booking_id
        }, content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('order_id', response.json())

    def test_6_non_customer_booking_block(self):
        """Verify Hotel Owners cannot create bookings."""
        self.client.force_authenticate(user=self.owner)
        response = self.client.post('/api/bookings/', {
            'hotel': self.hotel.id,
            'room': self.room.id,
            'check_in': '2026-10-10',
            'check_out': '2026-10-12',
            'guest_name': 'Owner User',
            'guest_email': 'owner@example.com',
            'guest_phone': '9876543210'
        }, content_type='application/json')
        
        self.assertEqual(response.status_code, 403)
