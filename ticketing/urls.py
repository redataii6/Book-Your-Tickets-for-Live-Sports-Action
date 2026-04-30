"""
Main URL configuration for the ticketing project.
- /api/   → DRF REST API (consumed by React frontend)
- /admin/ → Django built-in admin panel
- Legacy Django-template routes kept for reference but React SPA serves the UI.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('django-admin/', admin.site.urls),       # built-in admin
    path('api/', include('matches.api.urls')),     # DRF REST API
    path('', include('matches.urls')),             # legacy template routes (still work)
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
