import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def seed_users():
    # Admin User
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@bookmyroom.com',
            'first_name': 'System',
            'last_name': 'Admin',
            'role': User.ROLE_ADMIN,
            'is_staff': True,
            'is_superuser': True,
            'phone_number': '+91 9876543210',
            'bio': 'System Administrator'
        }
    )
    if created:
        admin_user.set_password('AdminPassword123!')
        admin_user.save()
        print("Created Admin user: admin / AdminPassword123!")
    else:
        print("Admin user already exists.")

    # Hotel Owner User
    owner_user, created = User.objects.get_or_create(
        username='owner_rahul',
        defaults={
            'email': 'rahul@grandpalace.com',
            'first_name': 'Rahul',
            'last_name': 'Sharma',
            'role': User.ROLE_HOTEL_OWNER,
            'phone_number': '+91 9898989898',
            'bio': 'Luxury Hotelier & Property Manager'
        }
    )
    if created:
        owner_user.set_password('OwnerPassword123!')
        owner_user.save()
        print("Created Hotel Owner: owner_rahul / OwnerPassword123!")
    else:
        print("Hotel Owner already exists.")

    # Customer User
    customer_user, created = User.objects.get_or_create(
        username='customer_priya',
        defaults={
            'email': 'priya@example.com',
            'first_name': 'Priya',
            'last_name': 'Patel',
            'role': User.ROLE_CUSTOMER,
            'phone_number': '+91 9123456789',
            'bio': 'Avid traveler and food enthusiast'
        }
    )
    if created:
        customer_user.set_password('CustomerPassword123!')
        customer_user.save()
        print("Created Customer: customer_priya / CustomerPassword123!")
    else:
        print("Customer already exists.")

if __name__ == '__main__':
    seed_users()
