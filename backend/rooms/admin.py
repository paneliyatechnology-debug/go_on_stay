from django.contrib import admin
from .models import Room, RoomImage

class RoomImageInline(admin.TabularInline):
    model = RoomImage
    extra = 1

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('title', 'hotel', 'room_type', 'price_per_night', 'capacity_adults', 'total_rooms')
    list_filter = ('room_type', 'breakfast_included', 'free_cancellation')
    search_fields = ('title', 'hotel__name')
    inlines = [RoomImageInline]

@admin.register(RoomImage)
class RoomImageAdmin(admin.ModelAdmin):
    list_display = ('room', 'is_primary', 'created_at')
