from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Role & Additional Info', {'fields': ('role', 'phone_number', 'avatar', 'bio', 'is_blocked')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Role & Additional Info', {'fields': ('role', 'phone_number', 'email')}),
    )
    list_display = ('username', 'email', 'role', 'phone_number', 'is_blocked', 'is_staff', 'created_at')
    list_filter = ('role', 'is_blocked', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email', 'phone_number', 'first_name', 'last_name')
