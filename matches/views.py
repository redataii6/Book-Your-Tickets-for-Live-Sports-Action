"""
Views for the University Sports Ticket Booking System.

View groups:
  AUTH      – register, login, logout
  PUBLIC    – home, match list, match detail
  CLIENT    – book ticket, my tickets, notifications, profile
  STAFF     – staff dashboard, approve/publish/hide match
  ADMIN     – admin dashboard, create/edit/delete match, manage users
"""

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.models import User
from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Q, Sum
from django.utils import timezone
from django.http import HttpResponseForbidden
from django.core.files.base import ContentFile

import qrcode
import qrcode.image.pil
from io import BytesIO

from .models import Match, Booking, Notification, UserProfile
from .forms  import RegisterForm, LoginForm, MatchForm, BookingForm, ProfileForm


# ════════════════════════════════════════════
# HELPER FUNCTIONS  (role checks)
# ════════════════════════════════════════════

def get_or_create_profile(user):
    """Ensure every User has a UserProfile."""
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile


# ────────────────────────────────────────────
# QR CODE HELPER
# ────────────────────────────────────────────
def generate_qr_for_booking(booking):
    """
    Generate a QR code PNG for a Booking and save it to booking.qr_code.
    The QR content encodes the booking reference and match details so stadium
    scanners can validate the ticket.
    """
    qr_data = (
        f"UNISPORTS|REF:{booking.booking_ref}"
        f"|MATCH:{booking.match.title}"
        f"|USER:{booking.user.username}"
        f"|QTY:{booking.quantity}"
        f"|PRICE:{booking.total_price}"
    )

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)

    filename = f"qr_{booking.booking_ref}.png"
    booking.qr_code.save(filename, ContentFile(buffer.read()), save=True)


def is_admin(user):
    return user.is_authenticated and (
        user.is_superuser or
        (hasattr(user, 'profile') and user.profile.role == 'admin')
    )


def is_staff_manager(user):
    return user.is_authenticated and (
        hasattr(user, 'profile') and user.profile.role == 'staff'
    )


def is_admin_or_staff(user):
    return is_admin(user) or is_staff_manager(user)


def notify_users(role, notif_type, title, message, link=''):
    """
    Send an in-app notification to all users with a given role.
    role: 'client' | 'staff' | 'admin'
    """
    if role == 'staff':
        recipients = User.objects.filter(profile__role='staff', is_active=True)
    elif role == 'client':
        recipients = User.objects.filter(profile__role='client', is_active=True)
    else:
        recipients = User.objects.filter(is_superuser=True)

    notifications = [
        Notification(
            recipient=u,
            notif_type=notif_type,
            title=title,
            message=message,
            link=link,
        )
        for u in recipients
    ]
    Notification.objects.bulk_create(notifications)


# ════════════════════════════════════════════
# AUTH VIEWS
# ════════════════════════════════════════════

def register_view(request):
    """
    Register a new client account.
    GET : show registration form
    POST: validate, create user, log in, redirect to home
    """
    if request.user.is_authenticated:
        return redirect('home')

    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, f"Welcome, {user.first_name}! Your account has been created.")
            return redirect('home')
        else:
            messages.error(request, "Please fix the errors below.")
    else:
        form = RegisterForm()

    return render(request, 'auth/register.html', {'form': form})


def login_view(request):
    """
    Log in an existing user.
    Redirects admin/staff to their dashboards; clients to home.
    """
    if request.user.is_authenticated:
        return redirect('home')

    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            messages.success(request, f"Welcome back, {user.username}!")
            profile = get_or_create_profile(user)
            if is_admin(user):
                return redirect('admin_dashboard')
            elif is_staff_manager(user):
                return redirect('staff_dashboard')
            return redirect('home')
        else:
            messages.error(request, "Invalid username or password.")
    else:
        form = LoginForm(request)

    return render(request, 'auth/login.html', {'form': form})


def logout_view(request):
    """Log out and redirect to home."""
    logout(request)
    messages.info(request, "You have been logged out.")
    return redirect('home')


# ════════════════════════════════════════════
# PUBLIC VIEWS
# ════════════════════════════════════════════

def home_view(request):
    """
    Home page: shows published matches with search & filter.
    Paginated – 6 matches per page.
    """
    matches = Match.objects.filter(status='published')

    # Search by title, team, or location
    query = request.GET.get('q', '').strip()
    if query:
        matches = matches.filter(
            Q(title__icontains=query) |
            Q(home_team__icontains=query) |
            Q(away_team__icontains=query) |
            Q(location__icontains=query)
        )

    # Filter by sport type
    sport_filter = request.GET.get('sport', '')
    if sport_filter in ['football', 'basketball']:
        matches = matches.filter(sport_type=sport_filter)

    # Paginate
    paginator = Paginator(matches, 6)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    context = {
        'page_obj':     page_obj,
        'query':        query,
        'sport_filter': sport_filter,
        'total_matches': matches.count(),
    }
    return render(request, 'public/home.html', context)


def match_detail_view(request, pk):
    """
    Match detail page for published matches.
    Shows match info and booking form for authenticated clients.
    """
    match = get_object_or_404(Match, pk=pk, status='published')
    form  = None
    user_booking = None

    if request.user.is_authenticated:
        profile = get_or_create_profile(request.user)
        # Check if user already booked this match
        user_booking = Booking.objects.filter(
            user=request.user, match=match
        ).first()

        if profile.is_client() and not user_booking:
            form = BookingForm(match=match)

    context = {
        'match':        match,
        'form':         form,
        'user_booking': user_booking,
    }
    return render(request, 'public/match_detail.html', context)


# ════════════════════════════════════════════
# CLIENT VIEWS
# ════════════════════════════════════════════

@login_required
def book_ticket_view(request, pk):
    """
    POST only: process a ticket booking for a client.
    Decrements available_seats and sends a booking confirmation notification.
    """
    match   = get_object_or_404(Match, pk=pk, status='published')
    profile = get_or_create_profile(request.user)

    if not profile.is_client():
        messages.error(request, "Only clients can book tickets.")
        return redirect('match_detail', pk=pk)

    # Prevent double booking
    if Booking.objects.filter(user=request.user, match=match).exists():
        messages.warning(request, "You have already booked tickets for this match.")
        return redirect('my_tickets')

    if request.method == 'POST':
        form = BookingForm(request.POST, match=match)
        if form.is_valid():
            qty         = form.cleaned_data['quantity']
            total_price = match.price * qty

            # Create booking
            booking = Booking.objects.create(
                user        = request.user,
                match       = match,
                quantity    = qty,
                total_price = total_price,
                status      = 'confirmed',
            )

            # Generate and store the QR code for this ticket
            generate_qr_for_booking(booking)

            # Decrement available seats
            match.available_seats -= qty
            match.save()

            # Notify the client
            Notification.objects.create(
                recipient  = request.user,
                notif_type = 'booking_conf',
                title      = f"Booking Confirmed – {match.title}",
                message    = (
                    f"Your booking for {match.title} has been confirmed!\n"
                    f"Tickets: {qty}  |  Total: ${total_price:.2f}\n"
                    f"Ref: {booking.booking_ref}"
                ),
                link       = '/my-tickets/',
            )

            messages.success(
                request,
                f"Booking confirmed! Ref: {booking.booking_ref}. "
                f"Check 'My Tickets' for details."
            )
            return redirect('ticket_detail', pk=booking.pk)
        else:
            messages.error(request, "Booking failed. Please check the form.")
            return redirect('match_detail', pk=pk)

    return redirect('match_detail', pk=pk)


@login_required
def my_tickets_view(request):
    """Shows the client's confirmed bookings (their tickets)."""
    bookings = Booking.objects.filter(
        user=request.user
    ).select_related('match').order_by('-booked_at')

    context = {'bookings': bookings}
    return render(request, 'client/my_tickets.html', context)


@login_required
def ticket_detail_view(request, pk):
    """
    Ticket confirmation / detail page.
    Shows the QR code and an interactive Leaflet map pinned to the stadium.
    """
    booking = get_object_or_404(Booking, pk=pk, user=request.user)
    return render(request, 'client/ticket_detail.html', {'booking': booking})


@login_required
def cancel_booking_view(request, pk):
    """Cancel a booking and restore the seat count."""
    booking = get_object_or_404(Booking, pk=pk, user=request.user)

    if booking.status == 'confirmed':
        booking.status = 'cancelled'
        booking.save()
        # Restore seats
        booking.match.available_seats += booking.quantity
        booking.match.save()
        messages.success(request, "Your booking has been cancelled.")
    else:
        messages.warning(request, "This booking cannot be cancelled.")

    return redirect('my_tickets')


@login_required
def notifications_view(request):
    """Shows all notifications for the logged-in user; marks them as read."""
    notifs = Notification.objects.filter(recipient=request.user)
    # Mark all as read
    notifs.filter(is_read=False).update(is_read=True)
    return render(request, 'client/notifications.html', {'notifications': notifs})


@login_required
def profile_view(request):
    """View and update the user's profile."""
    profile = get_or_create_profile(request.user)

    if request.method == 'POST':
        form = ProfileForm(request.POST, instance=profile, user=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, "Profile updated successfully!")
            return redirect('profile')
    else:
        form = ProfileForm(instance=profile, user=request.user)

    return render(request, 'client/profile.html', {'form': form, 'profile': profile})


# ════════════════════════════════════════════
# STAFF VIEWS
# ════════════════════════════════════════════

@login_required
@user_passes_test(is_admin_or_staff, login_url='/login/')
def staff_dashboard_view(request):
    """
    Staff dashboard: lists all matches with publish/hide controls.
    Staff can approve pending matches and toggle visibility.
    """
    matches  = Match.objects.all().order_by('-created_at')
    # Unread notifications for staff
    notifs   = Notification.objects.filter(
        recipient=request.user, is_read=False
    )[:5]

    # Counts for the summary cards
    pending_count   = matches.filter(status='pending').count()
    published_count = matches.filter(status='published').count()
    hidden_count    = matches.filter(status='hidden').count()

    context = {
        'matches':         matches,
        'notifications':   notifs,
        'pending_count':   pending_count,
        'published_count': published_count,
        'hidden_count':    hidden_count,
    }
    return render(request, 'staff/dashboard.html', context)


@login_required
@user_passes_test(is_admin_or_staff, login_url='/login/')
def publish_match_view(request, pk):
    """Staff approves and publishes a pending match."""
    match = get_object_or_404(Match, pk=pk)

    if match.status in ['pending', 'hidden']:
        match.status = 'published'
        match.save()

        # Notify all clients about the new published match
        notify_users(
            role       = 'client',
            notif_type = 'match_pub',
            title      = f"New Match Available: {match.title}",
            message    = (
                f"A new {match.get_sport_type_display()} match is available!\n"
                f"{match.home_team} vs {match.away_team}\n"
                f"Date: {match.date}  |  Venue: {match.location}"
            ),
            link       = f'/match/{match.pk}/',
        )
        messages.success(request, f"Match '{match.title}' has been published.")
    else:
        messages.warning(request, "Match is already published.")

    return redirect('staff_dashboard')


@login_required
@user_passes_test(is_admin_or_staff, login_url='/login/')
def hide_match_view(request, pk):
    """Staff hides a published match (removes it from client view)."""
    match = get_object_or_404(Match, pk=pk)

    if match.status == 'published':
        match.status = 'hidden'
        match.save()
        messages.success(request, f"Match '{match.title}' is now hidden.")
    else:
        messages.warning(request, "Match is not currently published.")

    return redirect('staff_dashboard')


# ════════════════════════════════════════════
# ADMIN VIEWS
# ════════════════════════════════════════════

@login_required
@user_passes_test(is_admin, login_url='/login/')
def admin_dashboard_view(request):
    """
    Admin dashboard: shows overview stats and recent activity.
    """
    total_matches   = Match.objects.count()
    total_bookings  = Booking.objects.count()
    total_users     = User.objects.count()
    total_revenue   = Booking.objects.filter(status='confirmed').aggregate(
        total=Sum('total_price')
    )['total'] or 0

    recent_matches  = Match.objects.order_by('-created_at')[:5]
    recent_bookings = Booking.objects.order_by('-booked_at')[:5]

    context = {
        'total_matches':   total_matches,
        'total_bookings':  total_bookings,
        'total_users':     total_users,
        'total_revenue':   total_revenue,
        'recent_matches':  recent_matches,
        'recent_bookings': recent_bookings,
    }
    return render(request, 'admin_panel/dashboard.html', context)


@login_required
@user_passes_test(is_admin, login_url='/login/')
def create_match_view(request):
    """
    Admin creates a new match.
    After creation, staff is notified automatically.
    """
    if request.method == 'POST':
        form = MatchForm(request.POST, request.FILES)
        if form.is_valid():
            match             = form.save(commit=False)
            match.created_by  = request.user
            match.status      = 'pending'   # needs staff approval
            match.save()

            # Notify all staff members
            notify_users(
                role       = 'staff',
                notif_type = 'new_match',
                title      = f"New Match Awaiting Approval: {match.title}",
                message    = (
                    f"Admin created a new match: {match.title}\n"
                    f"{match.home_team} vs {match.away_team}\n"
                    f"Date: {match.date}  |  Venue: {match.location}\n"
                    f"Please review and publish it from your dashboard."
                ),
                link       = '/staff/dashboard/',
            )

            messages.success(
                request,
                f"Match '{match.title}' created successfully! "
                f"Staff have been notified to approve it."
            )
            return redirect('admin_dashboard')
    else:
        form = MatchForm()

    return render(request, 'admin_panel/match_form.html', {
        'form':  form,
        'title': 'Create New Match',
    })


@login_required
@user_passes_test(is_admin, login_url='/login/')
def edit_match_view(request, pk):
    """Admin edits an existing match."""
    match = get_object_or_404(Match, pk=pk)

    if request.method == 'POST':
        form = MatchForm(request.POST, request.FILES, instance=match)
        if form.is_valid():
            form.save()
            messages.success(request, f"Match '{match.title}' updated.")
            return redirect('admin_dashboard')
    else:
        form = MatchForm(instance=match)

    return render(request, 'admin_panel/match_form.html', {
        'form':  form,
        'match': match,
        'title': f'Edit: {match.title}',
    })


@login_required
@user_passes_test(is_admin, login_url='/login/')
def delete_match_view(request, pk):
    """Admin deletes a match (confirmation step)."""
    match = get_object_or_404(Match, pk=pk)

    if request.method == 'POST':
        title = match.title
        match.delete()
        messages.success(request, f"Match '{title}' has been deleted.")
        return redirect('admin_dashboard')

    return render(request, 'admin_panel/match_confirm_delete.html', {'match': match})


@login_required
@user_passes_test(is_admin, login_url='/login/')
def manage_users_view(request):
    """Admin views all registered users and their roles."""
    users = User.objects.all().select_related('profile').order_by('-date_joined')
    return render(request, 'admin_panel/manage_users.html', {'users': users})


@login_required
@user_passes_test(is_admin, login_url='/login/')
def change_user_role_view(request, user_id):
    """Admin changes a user's role (client / staff / admin)."""
    target_user = get_object_or_404(User, pk=user_id)
    profile     = get_or_create_profile(target_user)

    if request.method == 'POST':
        new_role = request.POST.get('role', 'client')
        if new_role in ['client', 'staff', 'admin']:
            profile.role = new_role
            profile.save()
            # Sync Django's is_staff flag
            target_user.is_staff = new_role in ['staff', 'admin']
            target_user.save()
            messages.success(
                request,
                f"User '{target_user.username}' role changed to '{new_role}'."
            )
        else:
            messages.error(request, "Invalid role.")
    return redirect('manage_users')


@login_required
@user_passes_test(is_admin, login_url='/login/')
def all_bookings_view(request):
    """Admin views all bookings in the system."""
    bookings = Booking.objects.all().select_related('user', 'match').order_by('-booked_at')
    return render(request, 'admin_panel/all_bookings.html', {'bookings': bookings})
