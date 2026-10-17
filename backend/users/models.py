from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta

class User(AbstractUser):
    ROLE_CUSTOMER = 'CUSTOMER'
    ROLE_HOTEL_OWNER = 'HOTEL_OWNER'
    ROLE_HOTEL_STAFF = 'HOTEL_STAFF'
    ROLE_ADMIN = 'ADMIN'
    ROLE_SUPER_ADMIN = 'SUPER_ADMIN'
    ROLE_SUPPORT_AGENT = 'SUPPORT_AGENT'

    ROLE_CHOICES = (
        (ROLE_CUSTOMER, 'Customer / Guest'),
        (ROLE_HOTEL_OWNER, 'Hotel Owner'),
        (ROLE_HOTEL_STAFF, 'Hotel Staff'),
        (ROLE_ADMIN, 'Admin'),
        (ROLE_SUPER_ADMIN, 'Super Admin'),
        (ROLE_SUPPORT_AGENT, 'Support Agent'),
    )

    LANG_EN = 'en'
    LANG_HI = 'hi'
    LANG_GU = 'gu'

    LANGUAGE_CHOICES = (
        (LANG_EN, 'English'),
        (LANG_HI, 'Hindi'),
        (LANG_GU, 'Gujarati'),
    )

    CURRENCY_INR = 'INR'
    CURRENCY_USD = 'USD'
    CURRENCY_EUR = 'EUR'
    CURRENCY_GBP = 'GBP'
    CURRENCY_AED = 'AED'

    CURRENCY_CHOICES = (
        (CURRENCY_INR, 'Indian Rupee (₹)'),
        (CURRENCY_USD, 'US Dollar ($)'),
        (CURRENCY_EUR, 'Euro (€)'),
        (CURRENCY_GBP, 'British Pound (£)'),
        (CURRENCY_AED, 'UAE Dirham (AED)'),
    )

    role = models.CharField(max_length=25, choices=ROLE_CHOICES, default=ROLE_CUSTOMER)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    dob = models.DateField(blank=True, null=True)
    avatar = models.ImageField(upload_to='users/avatars/', blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    
    preferred_language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default=LANG_EN)
    preferred_currency = models.CharField(max_length=10, choices=CURRENCY_CHOICES, default=CURRENCY_INR)
    
    is_email_verified = models.BooleanField(default=True)
    is_blocked = models.BooleanField(default=False)
    
    reset_token = models.CharField(max_length=100, blank=True, null=True)
    reset_token_expires = models.DateTimeField(blank=True, null=True)

    razorpay_key_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_key_secret = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


import os
from django.db.models.signals import pre_save, post_delete
from django.dispatch import receiver

@receiver(pre_save, sender=User)
def auto_delete_old_avatar_on_change(sender, instance, **kwargs):
    """Automatically deletes old avatar file from disk when user updates profile picture."""
    if not instance.pk:
        return False

    try:
        old_instance = User.objects.get(pk=instance.pk)
        old_avatar = old_instance.avatar
    except User.DoesNotExist:
        return False

    new_avatar = instance.avatar
    if old_avatar and old_avatar != new_avatar:
        try:
            if os.path.isfile(old_avatar.path):
                os.remove(old_avatar.path)
        except Exception as e:
            print(f"Error removing old avatar file: {e}")

@receiver(post_delete, sender=User)
def auto_delete_avatar_on_user_delete(sender, instance, **kwargs):
    """Deletes avatar file from disk when user account is deleted."""
    if instance.avatar:
        try:
            if os.path.isfile(instance.avatar.path):
                os.remove(instance.avatar.path)
        except Exception as e:
            print(f"Error deleting user avatar file: {e}")


class EmailOTP(models.Model):
    email = models.EmailField(db_index=True)
    otp_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def is_expired(self, expiry_minutes=10):
        if not self.created_at:
            return False
        return timezone.now() > (self.created_at + timedelta(minutes=expiry_minutes))

    def __str__(self):
        return f"OTP for {self.email} - Verified: {self.is_verified}"


