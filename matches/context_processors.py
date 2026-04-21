"""
Context processors for the matches app.
These inject variables into EVERY template automatically.
"""

from .models import Notification


def notifications_context(request):
    """
    Injects 'unread_count' into every template context.
    Used by the navbar to show the notification badge.
    """
    unread_count = 0
    if request.user.is_authenticated:
        unread_count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
    return {'unread_count': unread_count}
