"""
Seed script - run once to create demo data.
  1. Admin superuser  (username: admin    / password: admin123)
  2. Staff manager    (username: staff1   / password: staff123)
  3. Sample client    (username: john_doe / password: client123)
  4. 4 sample matches (2 football, 2 basketball)

Run with:
    python seed_data.py
"""

import os
import sys
import django
import datetime

# Force UTF-8 output so Windows terminal does not break
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ticketing.settings')
django.setup()

from django.contrib.auth.models import User
from matches.models import UserProfile, Match, Notification

SEP = "-" * 50
print(SEP)
print("Seeding database...")

# ── 1. Admin superuser ────────────────────────────────
if not User.objects.filter(username='admin').exists():
    admin = User.objects.create_superuser(
        username='admin',
        email='admin@unisports.edu',
        password='admin123',
        first_name='Admin',
        last_name='User',
    )
    UserProfile.objects.create(user=admin, role='admin')
    print("[OK] Superuser created  ->  admin / admin123")
else:
    admin = User.objects.get(username='admin')
    # Ensure profile exists
    UserProfile.objects.get_or_create(user=admin, defaults={'role': 'admin'})
    print("     Admin already exists, skipping.")

# ── 2. Staff manager ──────────────────────────────────
if not User.objects.filter(username='staff1').exists():
    staff = User.objects.create_user(
        username='staff1',
        email='staff1@unisports.edu',
        password='staff123',
        first_name='Sarah',
        last_name='Manager',
    )
    staff.is_staff = True
    staff.save()
    UserProfile.objects.create(user=staff, role='staff')
    print("[OK] Staff user created ->  staff1 / staff123")
else:
    staff = User.objects.get(username='staff1')
    UserProfile.objects.get_or_create(user=staff, defaults={'role': 'staff'})
    print("     Staff user already exists, skipping.")

# ── 3. Sample client ──────────────────────────────────
if not User.objects.filter(username='john_doe').exists():
    client = User.objects.create_user(
        username='john_doe',
        email='john@student.edu',
        password='client123',
        first_name='John',
        last_name='Doe',
    )
    UserProfile.objects.create(user=client, role='client')
    print("[OK] Client created     ->  john_doe / client123")
else:
    print("     Client already exists, skipping.")

# ── 4. Sample matches ─────────────────────────────────
today = datetime.date.today()

sample_matches = [
    {
        'title'          : 'Champions Cup Final - Football',
        'sport_type'     : 'football',
        'home_team'      : 'UniSports Lions',
        'away_team'      : 'City College Eagles',
        'date'           : today + datetime.timedelta(days=7),
        'time'           : datetime.time(15, 0),
        'location'       : 'Main University Stadium',
        'description'    : 'The grand finale of the inter-university football championship. Do not miss it!',
        'price'          : 12.00,
        'total_seats'    : 200,
        'available_seats': 200,
        'status'         : 'published',
    },
    {
        'title'          : 'League Derby - Football',
        'sport_type'     : 'football',
        'home_team'      : 'North Campus FC',
        'away_team'      : 'South Campus United',
        'date'           : today + datetime.timedelta(days=14),
        'time'           : datetime.time(17, 30),
        'location'       : 'North Campus Ground',
        'description'    : 'The fiercest campus rivalry in university football.',
        'price'          : 8.50,
        'total_seats'    : 150,
        'available_seats': 150,
        'status'         : 'published',
    },
    {
        'title'          : 'Basketball Showdown - Semi Final',
        'sport_type'     : 'basketball',
        'home_team'      : 'UniSports Blazers',
        'away_team'      : 'Metro College Bulls',
        'date'           : today + datetime.timedelta(days=5),
        'time'           : datetime.time(19, 0),
        'location'       : 'Sports Complex Arena',
        'description'    : 'High-energy basketball semi-final. Fast-paced action guaranteed!',
        'price'          : 10.00,
        'total_seats'    : 300,
        'available_seats': 300,
        'status'         : 'published',
    },
    {
        'title'          : 'Freshers Basketball Tournament',
        'sport_type'     : 'basketball',
        'home_team'      : 'Freshers All-Stars',
        'away_team'      : 'Alumni Legends',
        'date'           : today + datetime.timedelta(days=21),
        'time'           : datetime.time(14, 0),
        'location'       : 'Indoor Sports Hall B',
        'description'    : 'Annual freshers vs alumni charity basketball game. All proceeds go to the sports fund.',
        'price'          : 5.00,
        'total_seats'    : 100,
        'available_seats': 100,
        'status'         : 'pending',
    },
]

created_count = 0
for data in sample_matches:
    title = data['title']
    if not Match.objects.filter(title=title).exists():
        m = Match.objects.create(created_by=admin, **data)
        print(f"[OK] Match [{m.status:10}] -> {m.title}")
        created_count += 1
    else:
        print(f"     Already exists: {title}")

# ── 5. Notify staff about pending match ───────────────
pending = Match.objects.filter(status='pending').first()
if pending and created_count > 0:
    Notification.objects.create(
        recipient  = staff,
        notif_type = 'new_match',
        title      = f"New Match Awaiting Approval: {pending.title}",
        message    = (
            f"Admin created a new match: {pending.title}\n"
            f"Please log in to your staff dashboard to review and publish it."
        ),
        link       = '/staff/dashboard/',
    )
    print("[OK] Staff notification sent for pending match.")

print(SEP)
print("Done! Login credentials:")
print("  Admin  ->  admin    / admin123")
print("  Staff  ->  staff1   / staff123")
print("  Client ->  john_doe / client123")
print(SEP)
