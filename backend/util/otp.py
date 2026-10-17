import random
import hashlib


def generate_otp():
    """Generates a 6-digit random numeric OTP string."""
    return str(random.randint(100000, 999999))


def hash_otp(otp):
    """Hashes the OTP string using SHA-256 for secure DB comparison."""
    return hashlib.sha256(str(otp).encode('utf-8')).hexdigest()
