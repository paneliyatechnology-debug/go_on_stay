from django.db import models
from django.conf import settings

class Amenity(models.Model):
    name = models.CharField(max_length=100, unique=True)
    icon_name = models.CharField(max_length=50, default='CheckCircle')
    category = models.CharField(max_length=50, default='General')

    def __str__(self):
        return self.name

class Hotel(models.Model):
    PROPERTY_TYPE_HOTEL = 'HOTEL'
    PROPERTY_TYPE_RESORT = 'RESORT'
    PROPERTY_TYPE_VILLA = 'VILLA'
    PROPERTY_TYPE_GUEST_HOUSE = 'GUEST_HOUSE'
    PROPERTY_TYPE_HOSTEL = 'HOSTEL'
    PROPERTY_TYPE_APARTMENT = 'APARTMENT'
    PROPERTY_TYPE_HOMESTAY = 'HOMESTAY'
    PROPERTY_TYPE_BOUTIQUE = 'BOUTIQUE_HOTEL'

    PROPERTY_TYPE_CHOICES = (
        (PROPERTY_TYPE_HOTEL, 'Hotel'),
        (PROPERTY_TYPE_RESORT, 'Resort'),
        (PROPERTY_TYPE_VILLA, 'Villa'),
        (PROPERTY_TYPE_GUEST_HOUSE, 'Guest House'),
        (PROPERTY_TYPE_HOSTEL, 'Hostel'),
        (PROPERTY_TYPE_APARTMENT, 'Apartment'),
        (PROPERTY_TYPE_HOMESTAY, 'Homestay'),
        (PROPERTY_TYPE_BOUTIQUE, 'Boutique Hotel'),
    )

    STATUS_DRAFT = 'DRAFT'
    STATUS_SUBMITTED = 'SUBMITTED'
    STATUS_UNDER_REVIEW = 'UNDER_REVIEW'
    STATUS_APPROVED = 'APPROVED'
    STATUS_REJECTED = 'REJECTED'
    STATUS_SUSPENDED = 'SUSPENDED'

    STATUS_CHOICES = (
        (STATUS_DRAFT, 'Draft'),
        (STATUS_SUBMITTED, 'Submitted'),
        (STATUS_UNDER_REVIEW, 'Under Review'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
        (STATUS_SUSPENDED, 'Suspended'),
    )

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='hotels'
    )
    name = models.CharField(max_length=255)
    description = models.TextField()
    property_type = models.CharField(max_length=30, choices=PROPERTY_TYPE_CHOICES, default=PROPERTY_TYPE_HOTEL)
    
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100, db_index=True)
    state = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=20, blank=True, null=True)
    country = models.CharField(max_length=100, default='India')
    
    area = models.CharField(max_length=150, blank=True, null=True)
    landmark = models.CharField(max_length=200, blank=True, null=True)
    destination = models.CharField(max_length=150, blank=True, null=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=6, blank=True, null=True, default=19.076000)
    longitude = models.DecimalField(max_digits=10, decimal_places=6, blank=True, null=True, default=72.877700)

    star_rating = models.IntegerField(default=4)
    guest_rating = models.DecimalField(max_digits=3, decimal_places=1, default=4.5)
    check_in_time = models.CharField(max_length=20, default='12:00 PM')
    check_out_time = models.CharField(max_length=20, default='11:00 AM')
    
    rules = models.TextField(blank=True, null=True, default='Valid ID required at check-in. Couples allowed.')
    cancellation_policy = models.TextField(blank=True, null=True, default='Free cancellation up to 24 hours prior to check-in date.')
    child_policy = models.TextField(blank=True, null=True, default='Children under 5 stay free without extra bed.')
    pet_policy = models.TextField(blank=True, null=True, default='Pets not allowed unless specified.')
    smoking_policy = models.TextField(blank=True, null=True, default='Non-smoking rooms available.')
    payment_policy = models.TextField(blank=True, null=True, default='Accepts online prepaid bookings via Razorpay.')
    safety_info = models.TextField(blank=True, null=True, default='CCTV cameras, 24/7 security guard, fire extinguishers.')
    nearby_attractions = models.TextField(blank=True, null=True, default='Airport 10km, Railway Station 4km.')

    amenities = models.ManyToManyField(Amenity, related_name='hotels', blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default=STATUS_SUBMITTED)
    is_approved = models.BooleanField(default=False)
    
    rejection_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.city}) - [{self.status}]"

class HotelImage(models.Model):
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='images')
    image_url = models.URLField(max_length=500, blank=True, null=True)
    image = models.ImageField(upload_to='hotels/images/', blank=True, null=True)
    caption = models.CharField(max_length=200, blank=True, null=True)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def get_image_display(self):
        if self.image:
            return self.image.url
        return self.image_url or ''

    def __str__(self):
        return f"Image for {self.hotel.name}"

class HotelVerificationDocument(models.Model):
    DOC_BUSINESS_REG = 'BUSINESS_REG'
    DOC_IDENTITY_PROOF = 'IDENTITY_PROOF'
    DOC_TAX_GST = 'TAX_GST'
    DOC_ADDRESS_PROOF = 'ADDRESS_PROOF'

    DOC_TYPE_CHOICES = (
        (DOC_BUSINESS_REG, 'Business Registration'),
        (DOC_IDENTITY_PROOF, 'Government ID Proof'),
        (DOC_TAX_GST, 'GST / Tax Certificate'),
        (DOC_ADDRESS_PROOF, 'Property Ownership / Address Proof'),
    )

    STATUS_PENDING = 'PENDING'
    STATUS_APPROVED = 'APPROVED'
    STATUS_REJECTED = 'REJECTED'

    STATUS_CHOICES = (
        (STATUS_PENDING, 'Pending Review'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
    )

    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='verification_documents')
    document_type = models.CharField(max_length=30, choices=DOC_TYPE_CHOICES)
    document_url = models.URLField(max_length=500, blank=True, null=True)
    document_file = models.FileField(upload_to='hotels/documents/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    rejection_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Doc {self.get_document_type_display()} - {self.hotel.name}"

class HotelStaff(models.Model):
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='staff_members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='hotel_staff_roles')
    role_title = models.CharField(max_length=100, default='Front Desk Manager')
    can_manage_bookings = models.BooleanField(default=True)
    can_manage_rooms = models.BooleanField(default=True)
    can_checkin_checkout = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('hotel', 'user')

    def __str__(self):
        return f"Staff {self.user.username} @ {self.hotel.name}"
