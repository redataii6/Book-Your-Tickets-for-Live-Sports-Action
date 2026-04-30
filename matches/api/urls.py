"""
API URL configuration for the UniSports Ticket Booking System.
All routes are prefixed with /api/ in the main ticketing/urls.py
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    # Auth
    RegisterView, MeView,
    # Public
    MatchListView, MatchDetailView,
    # Client
    BookTicketView, MyTicketsView, TicketDetailView, CancelBookingView, QRRefreshView,
    # Profile & Notifications
    ProfileView, NotificationsView, MarkNotificationsReadView,
    # Staff
    StaffMatchListView, PublishMatchView, HideMatchView,
    # Admin
    AdminDashboardView, AdminMatchListCreateView, AdminMatchDetailView,
    AdminUsersView, AdminChangeRoleView, AdminAllBookingsView,
)

urlpatterns = [

    # ── AUTH ────────────────────────────────────────────────
    path('auth/register/',          RegisterView.as_view(),       name='api_register'),
    path('auth/login/',             TokenObtainPairView.as_view(), name='api_login'),
    path('auth/token/refresh/',     TokenRefreshView.as_view(),   name='api_token_refresh'),
    path('auth/me/',                MeView.as_view(),             name='api_me'),

    # ── PUBLIC MATCHES ───────────────────────────────────────
    path('matches/',                MatchListView.as_view(),       name='api_match_list'),
    path('matches/<int:pk>/',       MatchDetailView.as_view(),     name='api_match_detail'),

    # ── CLIENT BOOKINGS ──────────────────────────────────────
    path('matches/<int:pk>/book/',  BookTicketView.as_view(),      name='api_book_ticket'),
    path('bookings/',               MyTicketsView.as_view(),       name='api_my_tickets'),
    path('bookings/<int:pk>/',      TicketDetailView.as_view(),    name='api_ticket_detail'),
    path('bookings/<int:pk>/cancel/', CancelBookingView.as_view(), name='api_cancel_booking'),
    path('bookings/<int:pk>/qr/',   QRRefreshView.as_view(),       name='api_qr_refresh'),

    # ── PROFILE & NOTIFICATIONS ──────────────────────────────
    path('profile/',                          ProfileView.as_view(),              name='api_profile'),
    path('notifications/',                    NotificationsView.as_view(),        name='api_notifications'),
    path('notifications/mark-read/',          MarkNotificationsReadView.as_view(), name='api_notif_mark_read'),

    # ── STAFF ────────────────────────────────────────────────
    path('staff/matches/',                    StaffMatchListView.as_view(),  name='api_staff_matches'),
    path('staff/matches/<int:pk>/publish/',   PublishMatchView.as_view(),    name='api_publish_match'),
    path('staff/matches/<int:pk>/hide/',      HideMatchView.as_view(),       name='api_hide_match'),

    # ── ADMIN ────────────────────────────────────────────────
    path('admin/dashboard/',                  AdminDashboardView.as_view(),       name='api_admin_dashboard'),
    path('admin/matches/',                    AdminMatchListCreateView.as_view(), name='api_admin_matches'),
    path('admin/matches/<int:pk>/',           AdminMatchDetailView.as_view(),     name='api_admin_match_detail'),
    path('admin/users/',                      AdminUsersView.as_view(),           name='api_admin_users'),
    path('admin/users/<int:pk>/role/',        AdminChangeRoleView.as_view(),      name='api_admin_change_role'),
    path('admin/bookings/',                   AdminAllBookingsView.as_view(),     name='api_admin_bookings'),
]
