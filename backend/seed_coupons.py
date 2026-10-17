import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from coupons.models import Coupon

def seed_coupons():
    today = date.today()
    future = today + timedelta(days=365)

    coupons_data = [
        {
            'code': 'WELCOME10',
            'discount_percentage': 10.00,
            'max_discount_amount': 500.00,
            'min_booking_amount': 1000.00,
            'valid_from': today,
            'valid_until': future,
            'is_active': True
        },
        {
            'code': 'LUXURY15',
            'discount_percentage': 15.00,
            'max_discount_amount': 1500.00,
            'min_booking_amount': 2500.00,
            'valid_from': today,
            'valid_until': future,
            'is_active': True
        },
        {
            'code': 'BMR20',
            'discount_percentage': 20.00,
            'max_discount_amount': 2000.00,
            'min_booking_amount': 3000.00,
            'valid_from': today,
            'valid_until': future,
            'is_active': True
        },
        {
            'code': 'SUMMERDEAL',
            'discount_percentage': 12.00,
            'max_discount_amount': 800.00,
            'min_booking_amount': 1500.00,
            'valid_from': today,
            'valid_until': future,
            'is_active': True
        },
        {
            'code': 'FESTIVE25',
            'discount_percentage': 25.00,
            'max_discount_amount': 3000.00,
            'min_booking_amount': 4000.00,
            'valid_from': today,
            'valid_until': future,
            'is_active': True
        }
    ]

    for c in coupons_data:
        Coupon.objects.get_or_create(
            code=c['code'],
            defaults=c
        )
    print("Coupons seeded successfully!")

if __name__ == '__main__':
    seed_coupons()
