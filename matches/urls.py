"""
URL configuration for the matches app.

URL patterns:
  /                        → home (match list)
  /match/<pk>/             → match detail
  /match/<pk>/book/        → book ticket (POST)
  /register/               → register
  /login/                  → login
  /logout/                 → logout
  /my-tickets/             → client's tickets
  /my-tickets/<pk>/cancel/ → cancel a booking
  /notifications/          → user notifications
  /profile/                → user profile
  /staff/dashboard/        → staff dashboard
  /staff/match/<pk>/publish/ → staff publishes match
  /staff/match/<pk>/hide/    → staff hides match
  /admin-panel/dashboard/    → admin dashboard
  /admin-panel/match/create/ → create match
  /admin-panel/match/<pk>/edit/   → edit match
  /admin-panel/match/<pk>/delete/ → delete match
  /admin-panel/users/             → manage users
  /admin-panel/users/<id>/role/   → change user role
  /admin-panel/bookings/          → all bookings
"""

from django.urls import path
from . import views

urlpatterns = [

    # ── PUBLIC ──────────────────────────────────────
    path('',                   views.home_view,         name='home'),
    path('match/<int:pk>/',    views.match_detail_view, name='match_detail'),

    # ── AUTH ────────────────────────────────────────
    path('register/',          views.register_view,     name='register'),
    path('login/',             views.login_view,        name='login'),
    path('logout/',            views.logout_view,       name='logout'),

    # ── CLIENT ──────────────────────────────────────
    path('match/<int:pk>/book/', views.book_ticket_view,    name='book_ticket'),
    path('my-tickets/',          views.my_tickets_view,     name='my_tickets'),
    path('my-tickets/<int:pk>/', views.ticket_detail_view,  name='ticket_detail'),
    path('my-tickets/<int:pk>/cancel/', views.cancel_booking_view, name='cancel_booking'),
    path('notifications/',       views.notifications_view, name='notifications'),
    path('profile/',             views.profile_view,       name='profile'),

    # ── STAFF ───────────────────────────────────────
    path('staff/dashboard/',              views.staff_dashboard_view, name='staff_dashboard'),
    path('staff/match/<int:pk>/publish/', views.publish_match_view,   name='publish_match'),
    path('staff/match/<int:pk>/hide/',    views.hide_match_view,      name='hide_match'),

    # ── ADMIN PANEL ─────────────────────────────────
    path('admin-panel/dashboard/',             views.admin_dashboard_view,  name='admin_dashboard'),
    path('admin-panel/match/create/',          views.create_match_view,     name='create_match'),
    path('admin-panel/match/<int:pk>/edit/',   views.edit_match_view,       name='edit_match'),
    path('admin-panel/match/<int:pk>/delete/', views.delete_match_view,     name='delete_match'),
    path('admin-panel/users/',                 views.manage_users_view,     name='manage_users'),
    path('admin-panel/users/<int:user_id>/role/', views.change_user_role_view, name='change_user_role'),
    path('admin-panel/bookings/',              views.all_bookings_view,     name='all_bookings'),
]
