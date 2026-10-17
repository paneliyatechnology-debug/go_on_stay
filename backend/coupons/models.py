from django.db import models

class Coupon(models.Model):
    code = models.CharField(max_length=50, unique=True)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)
    max_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=1000.00)
    min_booking_amount = models.DecimalField(max_digits=10, decimal_places=2, default=2000.00)
    valid_from = models.DateField()
    valid_until = models.DateField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.code} ({self.discount_percentage}% OFF)"
