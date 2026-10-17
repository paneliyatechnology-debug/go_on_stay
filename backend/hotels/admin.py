from django.contrib import admin
from .models import Hotel, HotelImage, Amenity

class HotelImageInline(admin.TabularInline):
    model = HotelImage
    extra = 1

@admin.register(Hotel)
class HotelAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'owner', 'star_rating', 'guest_rating', 'is_approved', 'created_at')
    list_filter = ('city', 'star_rating', 'is_approved')
    search_fields = ('name', 'city', 'address', 'owner__username')
    inlines = [HotelImageInline]

@admin.register(Amenity)
class AmenityAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'icon_name')
    list_filter = ('category',)

@admin.register(HotelImage)
class HotelImageAdmin(admin.ModelAdmin):
    list_display = ('hotel', 'caption', 'is_primary', 'created_at')
