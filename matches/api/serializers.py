"""
DRF Serializers for the UniSports Ticket Booking API.
"""

from django.contrib.auth.models import User
from rest_framework import serializers
from matches.models import Match, Booking, Notification, UserProfile


# ─────────────────────────────────────────────
# Auth / User serializers
# ─────────────────────────────────────────────

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = UserProfile
        fields = ['role', 'phone', 'bio']


class UserSerializer(serializers.ModelSerializer):
    """Read-only user representation (includes role via profile)."""
    role     = serializers.CharField(source='profile.role',     read_only=True, default='client')
    phone    = serializers.CharField(source='profile.phone',    read_only=True, default='')
    bio      = serializers.CharField(source='profile.bio',      read_only=True, default='')
    location = serializers.CharField(source='profile.location', read_only=True, default='')

    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'bio', 'location']


class RegisterSerializer(serializers.ModelSerializer):
    """Used for POST /api/auth/register/"""
    password  = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True, label='Confirm password')
    first_name = serializers.CharField(required=True)
    last_name  = serializers.CharField(required=True)

    class Meta:
        model  = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password2']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        # Create a client profile
        UserProfile.objects.create(user=user, role='client')
        return user


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Used for PATCH /api/profile/ — updates User + UserProfile fields."""
    first_name = serializers.CharField(source='user.first_name')
    last_name  = serializers.CharField(source='user.last_name')
    email      = serializers.EmailField(source='user.email')

    class Meta:
        model  = UserProfile
        fields = ['first_name', 'last_name', 'email', 'phone', 'bio', 'location']

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        # Update User fields
        for attr, value in user_data.items():
            setattr(instance.user, attr, value)
        instance.user.save()
        # Update UserProfile fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


# ─────────────────────────────────────────────
# Match serializers
# ─────────────────────────────────────────────

class MatchListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for the match list page."""
    sport_display = serializers.CharField(source='get_sport_type_display', read_only=True)
    is_available  = serializers.BooleanField(read_only=True)
    image_url     = serializers.SerializerMethodField()
    full_location = serializers.CharField(read_only=True)

    class Meta:
        model  = Match
        fields = [
            'id', 'title', 'sport_type', 'sport_display',
            'home_team', 'away_team', 'date', 'time',
            'city', 'country', 'location', 'full_location',
            'price', 'total_seats', 'available_seats',
            'status', 'image_url', 'is_available',
        ]

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None


class MatchDetailSerializer(MatchListSerializer):
    """Full match detail including coordinates and description."""
    class Meta(MatchListSerializer.Meta):
        fields = MatchListSerializer.Meta.fields + [
            'description', 'latitude', 'longitude', 'created_at',
        ]


class MatchWriteSerializer(serializers.ModelSerializer):
    """Used by admin to create / update a match."""
    class Meta:
        model  = Match
        fields = [
            'title', 'sport_type', 'home_team', 'away_team',
            'date', 'time', 'city', 'country', 'location',
            'latitude', 'longitude',
            'description', 'price', 'total_seats', 'available_seats',
            'status', 'image',
        ]


# ─────────────────────────────────────────────
# Booking serializers
# ─────────────────────────────────────────────

class BookingSerializer(serializers.ModelSerializer):
    """Full booking info, including nested match summary."""
    match   = MatchListSerializer(read_only=True)
    user    = UserSerializer(read_only=True)
    qr_url  = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model  = Booking
        fields = [
            'id', 'booking_ref', 'status', 'status_display',
            'quantity', 'total_price', 'booked_at',
            'match', 'user', 'qr_url',
        ]

    def get_qr_url(self, obj):
        request = self.context.get('request')
        if obj.qr_code and request:
            return request.build_absolute_uri(obj.qr_code.url)
        return None


class BookingCreateSerializer(serializers.Serializer):
    """Used for POST /api/matches/<pk>/book/"""
    quantity = serializers.IntegerField(min_value=1)


# ─────────────────────────────────────────────
# Notification serializer
# ─────────────────────────────────────────────

class NotificationSerializer(serializers.ModelSerializer):
    notif_type_display = serializers.CharField(source='get_notif_type_display', read_only=True)

    class Meta:
        model  = Notification
        fields = [
            'id', 'notif_type', 'notif_type_display',
            'title', 'message', 'is_read', 'created_at', 'link',
        ]


# ─────────────────────────────────────────────
# Admin user management serializer
# ─────────────────────────────────────────────

class AdminUserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role', read_only=True, default='client')

    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'is_active', 'date_joined', 'role']
