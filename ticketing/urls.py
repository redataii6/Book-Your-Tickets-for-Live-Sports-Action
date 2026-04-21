"""
Main URL configuration for the ticketing project.
Routes requests to the matches app and Django admin.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),       # Django built-in admin panel
    path('', include('matches.urls')),      # All app URLs handled by matches app
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
