"""
DRF API Views for the UniSports Ticket Booking System.

All views return JSON. Authentication is JWT-based.

View groups:
  AUTH      – register, login (handled by simplejwt), me
  PUBLIC    – match list, match detail
  CLIENT    – book ticket, my tickets, ticket detail, cancel, QR refresh
  PROFILE   – view / update profile
  NOTIF     – notifications, mark read
  STAFF     – dashboard list, publish, hide
  ADMIN     – dashboard stats, CRUD matches, manage users, all bookings
"""

import hashlib
import math
import re

import qrcode
from io import BytesIO

from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db.models import Q, Sum
from django.utils import timezone
from django.conf import settings

from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken

from matches.models import Match, Booking, Notification, UserProfile
from .serializers import (
    RegisterSerializer, UserSerializer, ProfileUpdateSerializer,
    MatchListSerializer, MatchDetailSerializer, MatchWriteSerializer,
    BookingSerializer, BookingCreateSerializer,
    NotificationSerializer, AdminUserSerializer,
)


# ════════════════════════════════════════════
# PERMISSION HELPERS
# ════════════════════════════════════════════

def get_or_create_profile(user):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile


class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        try:
            return request.user.profile.role == 'admin'
        except UserProfile.DoesNotExist:
            return False


class IsStaffOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        try:
            return request.user.profile.role in ('staff', 'admin')
        except UserProfile.DoesNotExist:
            return False


class IsClientRole(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        try:
            return request.user.profile.role == 'client'
        except UserProfile.DoesNotExist:
            return True  # default to client if no profile


# ════════════════════════════════════════════
# QR CODE HELPERS
# ════════════════════════════════════════════

def _minute_token(booking_ref):
    now_utc = timezone.now()
    bucket  = math.floor(now_utc.timestamp() / 60)
    raw     = f"{booking_ref}:{bucket}"
    return hashlib.sha256(raw.encode()).hexdigest()[:8]


def generate_timed_qr(booking):
    """Generate a per-minute rotating QR PNG. Returns (relative_path, expires_datetime)."""
    token   = _minute_token(booking.booking_ref)
    now_utc = timezone.now()
    expires = now_utc + timezone.timedelta(seconds=60)

    qr_data = (
        f"UNISPORTS|REF:{booking.booking_ref}"
        f"|MATCH:{booking.match.title}"
        f"|USER:{booking.user.username}"
        f"|QTY:{booking.quantity}"
        f"|PRICE:{booking.total_price}"
        f"|TOKEN:{token}"
        f"|EXPIRES:{expires.strftime('%Y%m%dT%H%M%SZ')}"
    )

    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_H,
                       box_size=10, border=4)
    qr.add_data(qr_data)
    qr.make(fit=True)
    img    = qr.make_image(fill_color='black', back_color='white')
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)

    relative_path = f"qr_codes/qr_{booking.booking_ref}_{token}.png"
    if not default_storage.exists(relative_path):
        default_storage.save(relative_path, ContentFile(buffer.read()))

    return relative_path, expires


def generate_initial_qr(booking):
    """Generate the static (non-rotating) QR saved to booking.qr_code field."""
    qr_data = (
        f"UNISPORTS|REF:{booking.booking_ref}"
        f"|MATCH:{booking.match.title}"
        f"|USER:{booking.user.username}"
        f"|QTY:{booking.quantity}"
        f"|PRICE:{booking.total_price}"
    )
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_H,
                       box_size=10, border=4)
    qr.add_data(qr_data)
    qr.make(fit=True)
    img    = qr.make_image(fill_color='black', back_color='white')
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    filename = f"qr_{booking.booking_ref}.png"
    booking.qr_code.save(filename, ContentFile(buffer.read()), save=True)


def notify_users(role, notif_type, title, message, link=''):
    if role == 'staff':
        recipients = User.objects.filter(profile__role='staff', is_active=True)
    elif role == 'client':
        recipients = User.objects.filter(profile__role='client', is_active=True)
    else:
        recipients = User.objects.filter(is_superuser=True)
    Notification.objects.bulk_create([
        Notification(recipient=u, notif_type=notif_type, title=title,
                     message=message, link=link)
        for u in recipients
    ])


# ════════════════════════════════════════════
# AUTH VIEWS
# ════════════════════════════════════════════

class RegisterView(APIView):
    """POST /api/auth/register/ — public"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user    = serializer.save()
            refresh = RefreshToken.for_user(user)
            profile = get_or_create_profile(user)
            return Response({
                'access':  str(refresh.access_token),
                'refresh': str(refresh),
                'user':    UserSerializer(user).data,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    """GET /api/auth/me/ — returns current user info + role"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        get_or_create_profile(request.user)
        return Response(UserSerializer(request.user).data)


# ════════════════════════════════════════════
# MATCH VIEWS — PUBLIC
# ════════════════════════════════════════════

class MatchListView(generics.ListAPIView):
    """GET /api/matches/ — list published matches, open to all"""
    permission_classes = [permissions.AllowAny]
    serializer_class   = MatchListSerializer

    def get_queryset(self):
        qs = Match.objects.filter(status='published')
        q  = self.request.query_params.get('q', '').strip()
        if q:
            qs = qs.filter(
                Q(title__icontains=q) | Q(home_team__icontains=q) |
                Q(away_team__icontains=q) | Q(location__icontains=q)
            )
        sport = self.request.query_params.get('sport', '')
        if sport in ('football', 'basketball'):
            qs = qs.filter(sport_type=sport)
        return qs


class MatchDetailView(generics.RetrieveAPIView):
    """GET /api/matches/<pk>/ — open to all"""
    permission_classes = [permissions.AllowAny]
    serializer_class   = MatchDetailSerializer
    queryset           = Match.objects.filter(status='published')


class MatchRecommendationView(generics.ListAPIView):
    """GET /api/matches/recommendations/

    1. Splits the user's profile location by common separators (-, ,, /)
       to extract individual tokens (e.g. 'Morocco - Casablanca' → ['Morocco', 'Casablanca']).
    2. Filters published matches where ANY token matches country OR city (case-insensitive).
    3. Falls back to the 6 soonest published matches globally if nothing matches.
    Requires authentication.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class   = MatchListSerializer
    pagination_class   = None

    def get_queryset(self):
        profile = get_or_create_profile(self.request.user)
        user_loc = (profile.location or '').strip()

        published = Match.objects.filter(status='published').order_by('date')

        if user_loc:
            # Split on -, ,, / to get individual tokens
            # e.g. "Morocco - Casablanca" → ["Morocco", "Casablanca"]
            # e.g. "France, Paris"        → ["France", "Paris"]
            # e.g. "Morocco"              → ["Morocco"]
            tokens = [t.strip() for t in re.split(r'[-,/|]+', user_loc) if t.strip()]

            if tokens:
                # Build OR filter: each token may match:
                #   - country  (structured field, exact)
                #   - city     (structured field, exact)
                #   - location (legacy free-text field, contains) ← fixes existing matches
                q = Q()
                for token in tokens:
                    q |= (
                        Q(country__iexact=token)    |
                        Q(city__iexact=token)        |
                        Q(location__icontains=token)
                    )

                by_location = published.filter(q)
                if by_location.exists():
                    return by_location[:6]

        # Fallback: 6 soonest published matches globally
        return published[:6]


# ════════════════════════════════════════════
# BOOKING VIEWS — CLIENT
# ════════════════════════════════════════════

class BookTicketView(APIView):
    """POST /api/matches/<pk>/book/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        match   = Match.objects.filter(pk=pk, status='published').first()
        if not match:
            return Response({'detail': 'Match not found or not available.'}, status=404)

        profile = get_or_create_profile(request.user)
        if not profile.is_client():
            return Response({'detail': 'Only clients can book tickets.'}, status=403)

        if Booking.objects.filter(user=request.user, match=match).exists():
            return Response({'detail': 'You already have a booking for this match.'}, status=400)

        serializer = BookingCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        qty         = serializer.validated_data['quantity']
        if qty > match.available_seats:
            return Response({'detail': f'Only {match.available_seats} seats available.'}, status=400)

        total_price = match.price * qty
        booking = Booking.objects.create(
            user=request.user, match=match,
            quantity=qty, total_price=total_price, status='confirmed',
        )
        generate_initial_qr(booking)

        match.available_seats -= qty
        match.save()

        Notification.objects.create(
            recipient=request.user, notif_type='booking_conf',
            title=f"Booking Confirmed – {match.title}",
            message=(
                f"Your booking for {match.title} has been confirmed!\n"
                f"Tickets: {qty}  |  Total: ${total_price:.2f}\n"
                f"Ref: {booking.booking_ref}"
            ),
            link='/my-tickets/',
        )

        return Response(
            BookingSerializer(booking, context={'request': request}).data,
            status=201,
        )


class MyTicketsView(generics.ListAPIView):
    """GET /api/bookings/ — authenticated user's bookings"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class   = BookingSerializer

    def get_queryset(self):
        return Booking.objects.filter(
            user=self.request.user
        ).select_related('match', 'user__profile').order_by('-booked_at')


class TicketDetailView(generics.RetrieveAPIView):
    """GET /api/bookings/<pk>/"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class   = BookingSerializer

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user).select_related('match')


class CancelBookingView(APIView):
    """POST /api/bookings/<pk>/cancel/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        booking = Booking.objects.filter(pk=pk, user=request.user).first()
        if not booking:
            return Response({'detail': 'Booking not found.'}, status=404)
        if booking.status != 'confirmed':
            return Response({'detail': 'Only confirmed bookings can be cancelled.'}, status=400)

        booking.status = 'cancelled'
        booking.save()
        booking.match.available_seats += booking.quantity
        booking.match.save()
        return Response({'detail': 'Booking cancelled successfully.'})


class QRRefreshView(APIView):
    """GET /api/bookings/<pk>/qr/ — returns a fresh per-minute QR URL"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        booking = Booking.objects.filter(pk=pk, user=request.user).first()
        if not booking:
            return Response({'detail': 'Booking not found.'}, status=404)

        relative_path, expires = generate_timed_qr(booking)
        qr_url       = request.build_absolute_uri(f"{settings.MEDIA_URL}{relative_path}")
        now_utc      = timezone.now()
        seconds_left = max(0, int((expires - now_utc).total_seconds()))

        return Response({
            'qr_url':      qr_url,
            'expires_at':  expires.strftime('%Y-%m-%dT%H:%M:%SZ'),
            'seconds_left': seconds_left,
        })


# ════════════════════════════════════════════
# PROFILE
# ════════════════════════════════════════════

class ProfileView(APIView):
    """GET / PATCH /api/profile/"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = get_or_create_profile(request.user)
        data = {
            'id':         request.user.id,
            'username':   request.user.username,
            'email':      request.user.email,
            'first_name': request.user.first_name,
            'last_name':  request.user.last_name,
            'role':       profile.role,
            'phone':      profile.phone or '',
            'bio':        profile.bio   or '',
            'location':   profile.location or '',
        }
        return Response(data)

    def patch(self, request):
        profile    = get_or_create_profile(request.user)
        serializer = ProfileUpdateSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'detail': 'Profile updated.'})
        return Response(serializer.errors, status=400)


# ════════════════════════════════════════════
# NOTIFICATIONS
# ════════════════════════════════════════════

class NotificationsView(generics.ListAPIView):
    """GET /api/notifications/"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class   = NotificationSerializer
    pagination_class   = None  # return all

    def get_queryset(self):
        qs = Notification.objects.filter(recipient=self.request.user)
        qs.filter(is_read=False).update(is_read=True)
        return qs


class MarkNotificationsReadView(APIView):
    """POST /api/notifications/mark-read/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(
            recipient=request.user, is_read=False
        ).update(is_read=True)
        return Response({'detail': 'All notifications marked as read.'})


# ════════════════════════════════════════════
# STAFF VIEWS
# ════════════════════════════════════════════

class StaffMatchListView(generics.ListAPIView):
    """GET /api/staff/matches/ — all matches for staff dashboard"""
    permission_classes = [IsStaffOrAdmin]
    serializer_class   = MatchDetailSerializer
    pagination_class   = None

    def get_queryset(self):
        return Match.objects.all().order_by('-created_at')


class PublishMatchView(APIView):
    """POST /api/staff/matches/<pk>/publish/"""
    permission_classes = [IsStaffOrAdmin]

    def post(self, request, pk):
        match = Match.objects.filter(pk=pk).first()
        if not match:
            return Response({'detail': 'Match not found.'}, status=404)
        if match.status in ('pending', 'hidden'):
            match.status = 'published'
            match.save()
            notify_users('client', 'match_pub',
                         f"New Match Available: {match.title}",
                         f"A new {match.get_sport_type_display()} match is available!\n"
                         f"{match.home_team} vs {match.away_team}\n"
                         f"Date: {match.date}  |  Venue: {match.location}",
                         link=f'/match/{match.pk}')
            return Response({'detail': f"Match '{match.title}' published."})
        return Response({'detail': 'Match is already published.'}, status=400)


class HideMatchView(APIView):
    """POST /api/staff/matches/<pk>/hide/"""
    permission_classes = [IsStaffOrAdmin]

    def post(self, request, pk):
        match = Match.objects.filter(pk=pk).first()
        if not match:
            return Response({'detail': 'Match not found.'}, status=404)
        if match.status == 'published':
            match.status = 'hidden'
            match.save()
            return Response({'detail': f"Match '{match.title}' hidden."})
        return Response({'detail': 'Match is not currently published.'}, status=400)


# ════════════════════════════════════════════
# ADMIN VIEWS
# ════════════════════════════════════════════

class AdminDashboardView(APIView):
    """GET /api/admin/dashboard/"""
    permission_classes = [IsAdminRole]

    def get(self, request):
        total_revenue = Booking.objects.filter(status='confirmed').aggregate(
            total=Sum('total_price')
        )['total'] or 0

        recent_matches  = MatchListSerializer(
            Match.objects.order_by('-created_at')[:5],
            many=True, context={'request': request}
        ).data
        recent_bookings = BookingSerializer(
            Booking.objects.order_by('-booked_at')[:5],
            many=True, context={'request': request}
        ).data

        return Response({
            'total_matches':   Match.objects.count(),
            'total_bookings':  Booking.objects.count(),
            'total_users':     User.objects.count(),
            'total_revenue':   float(total_revenue),
            'pending_matches': Match.objects.filter(status='pending').count(),
            'recent_matches':  recent_matches,
            'recent_bookings': recent_bookings,
        })


class AdminMatchListCreateView(generics.ListCreateAPIView):
    """GET /api/admin/matches/ — POST /api/admin/matches/"""
    permission_classes = [IsAdminRole]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MatchWriteSerializer
        return MatchDetailSerializer

    def get_queryset(self):
        return Match.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        match = serializer.save(created_by=self.request.user, status='pending')
        notify_users('staff', 'new_match',
                     f"New Match Awaiting Approval: {match.title}",
                     f"Admin created: {match.title}\n"
                     f"{match.home_team} vs {match.away_team}\n"
                     f"Date: {match.date}  |  Venue: {match.location}\n"
                     "Please review and publish from your dashboard.",
                     link='/staff')


class AdminMatchDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET / PATCH / DELETE /api/admin/matches/<pk>/"""
    permission_classes = [IsAdminRole]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]
    queryset           = Match.objects.all()

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return MatchWriteSerializer
        return MatchDetailSerializer


class AdminUsersView(generics.ListAPIView):
    """GET /api/admin/users/"""
    permission_classes = [IsAdminRole]
    serializer_class   = AdminUserSerializer
    pagination_class   = None

    def get_queryset(self):
        return User.objects.all().select_related('profile').order_by('-date_joined')


class AdminChangeRoleView(APIView):
    """PATCH /api/admin/users/<pk>/role/"""
    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        target_user = User.objects.filter(pk=pk).first()
        if not target_user:
            return Response({'detail': 'User not found.'}, status=404)

        new_role = request.data.get('role', 'client')
        if new_role not in ('client', 'staff', 'admin'):
            return Response({'detail': 'Invalid role.'}, status=400)

        profile      = get_or_create_profile(target_user)
        profile.role = new_role
        profile.save()
        target_user.is_staff = new_role in ('staff', 'admin')
        target_user.save()
        return Response({'detail': f"Role updated to '{new_role}'."})


class AdminAllBookingsView(generics.ListAPIView):
    """GET /api/admin/bookings/"""
    permission_classes = [IsAdminRole]
    serializer_class   = BookingSerializer

    def get_queryset(self):
        return Booking.objects.all().select_related('user', 'match').order_by('-booked_at')
