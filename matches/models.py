"""
Models for the University Sports Ticket Booking System.

Models:
- UserProfile : extends Django User with a role field
- Match       : a sports match (football or basketball)
- Booking     : a ticket booking by a client user
- Notification: in-app notifications for users
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


# ─────────────────────────────────────────────
# 1.  USER PROFILE  (extends Django's built-in User)
# ─────────────────────────────────────────────
class UserProfile(models.Model):
    """
    Extends the built-in User model with a role.
    Roles:
        'client' – regular student/visitor
        'staff'  – match manager (can publish / hide matches)
        'admin'  – superuser (full control, set via is_superuser)
    """
    ROLE_CHOICES = [
        ('client', 'Client'),
        ('staff',  'Staff / Match Manager'),
        ('admin',  'Admin'),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='client')
    phone = models.CharField(max_length=20, blank=True, null=True)
    bio   = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"

    def is_admin(self):
        return self.role == 'admin' or self.user.is_superuser

    def is_staff_manager(self):
        return self.role == 'staff'

    def is_client(self):
        return self.role == 'client'


# ─────────────────────────────────────────────
# 2.  MATCH
# ─────────────────────────────────────────────
class Match(models.Model):
    """
    Represents a sports match (football or basketball).
    Created by Admin; published/hidden by Staff.
    """
    SPORT_CHOICES = [
        ('football',   'Football / Soccer'),
        ('basketball', 'Basketball'),
    ]
    STATUS_CHOICES = [
        ('pending',   'Pending Approval'),   # just created by admin
        ('published', 'Published'),           # approved & visible to clients
        ('hidden',    'Hidden'),              # hidden by staff
        ('cancelled', 'Cancelled'),
    ]

    title          = models.CharField(max_length=200)
    sport_type     = models.CharField(max_length=20, choices=SPORT_CHOICES)
    home_team      = models.CharField(max_length=100)
    away_team      = models.CharField(max_length=100)
    date           = models.DateField()
    time           = models.TimeField()
    location       = models.CharField(max_length=200)
    latitude       = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True,
                        help_text='Stadium latitude (e.g. 33.9716)')
    longitude      = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True,
                        help_text='Stadium longitude (e.g. -6.8498)')
    description    = models.TextField(blank=True)
    price          = models.DecimalField(max_digits=8, decimal_places=2)
    total_seats    = models.PositiveIntegerField()
    available_seats= models.PositiveIntegerField()
    status         = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    image          = models.ImageField(upload_to='match_images/', blank=True, null=True)
    created_by     = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_matches'
    )
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date', 'time']

    def __str__(self):
        return f"{self.title} ({self.date})"

    def is_available(self):
        """Returns True if tickets are still available."""
        return self.available_seats > 0 and self.status == 'published'

    def sport_icon(self):
        """Returns a Bootstrap icon class for the sport."""
        icons = {
            'football':   'bi-dribbble',
            'basketball': 'bi-basketball',
        }
        return icons.get(self.sport_type, 'bi-trophy')


# ─────────────────────────────────────────────
# 3.  BOOKING  (Ticket purchase)
# ─────────────────────────────────────────────
class Booking(models.Model):
    """
    A ticket booking made by a client for a specific match.
    """
    STATUS_CHOICES = [
        ('pending',   'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]

    user           = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='bookings'
    )
    match          = models.ForeignKey(
        Match,
        on_delete=models.CASCADE,
        related_name='bookings'
    )
    quantity       = models.PositiveIntegerField(default=1)
    total_price    = models.DecimalField(max_digits=10, decimal_places=2)
    status         = models.CharField(max_length=10, choices=STATUS_CHOICES, default='confirmed')
    booking_ref    = models.CharField(max_length=20, unique=True)  # e.g. TKT-0001
    qr_code        = models.ImageField(upload_to='qr_codes/', blank=True, null=True)
    booked_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-booked_at']

    def __str__(self):
        return f"Booking {self.booking_ref} – {self.user.username} → {self.match.title}"

    def save(self, *args, **kwargs):
        """Auto-generate a booking reference if not set."""
        if not self.booking_ref:
            # Format: TKT-<user_id>-<timestamp>
            ts = timezone.now().strftime('%Y%m%d%H%M%S')
            self.booking_ref = f"TKT-{self.user.id}-{ts}"
        super().save(*args, **kwargs)


# ─────────────────────────────────────────────
# 4.  NOTIFICATION
# ─────────────────────────────────────────────
class Notification(models.Model):
    """
    In-app notification for a user.
    Can be triggered when:
    - A new match is created (notifies staff)
    - A match is published (notifies clients)
    - A booking is confirmed (notifies the client)
    """
    NOTIF_TYPES = [
        ('new_match',    'New Match Created'),
        ('match_pub',    'Match Published'),
        ('booking_conf', 'Booking Confirmed'),
        ('match_update', 'Match Updated'),
        ('general',      'General'),
    ]

    recipient   = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notif_type  = models.CharField(max_length=20, choices=NOTIF_TYPES, default='general')
    title       = models.CharField(max_length=200)
    message     = models.TextField()
    is_read     = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)
    link        = models.CharField(max_length=300, blank=True)  # optional URL

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.notif_type}] → {self.recipient.username}: {self.title}"
