"""
Admin configuration for the matches app.
Registers all models with the Django admin site
and adds useful list displays, filters, and search.
"""

from django.contrib import admin
from .models import Match, Booking, Notification, UserProfile


# ─────────────────────────────────────────────
# USER PROFILE
# ─────────────────────────────────────────────
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display  = ('user', 'role', 'phone')
    list_filter   = ('role',)
    search_fields = ('user__username', 'user__email')


# ─────────────────────────────────────────────
# MATCH
# ─────────────────────────────────────────────
@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display  = ('title', 'sport_type', 'home_team', 'away_team',
                     'date', 'time', 'status', 'available_seats', 'price')
    list_filter   = ('status', 'sport_type', 'date')
    search_fields = ('title', 'home_team', 'away_team', 'location')
    readonly_fields = ('created_at', 'updated_at', 'available_seats')
    date_hierarchy  = 'date'


# ─────────────────────────────────────────────
# BOOKING
# ─────────────────────────────────────────────
@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display  = ('booking_ref', 'user', 'match', 'quantity',
                     'total_price', 'status', 'booked_at')
    list_filter   = ('status', 'booked_at')
    search_fields = ('booking_ref', 'user__username', 'match__title')
    readonly_fields = ('booking_ref', 'booked_at')


# ─────────────────────────────────────────────
# NOTIFICATION
# ─────────────────────────────────────────────
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display  = ('title', 'recipient', 'notif_type', 'is_read', 'created_at')
    list_filter   = ('notif_type', 'is_read')
    search_fields = ('title', 'recipient__username')
    readonly_fields = ('created_at',)
