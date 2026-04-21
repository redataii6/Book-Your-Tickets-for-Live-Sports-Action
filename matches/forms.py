"""
Forms for the University Sports Ticket Booking System.

Forms:
- RegisterForm   : new user registration (with role selection)
- LoginForm      : user login
- MatchForm      : create / edit a match (admin only)
- BookingForm    : book tickets for a match
- ProfileForm    : update user profile info
"""

from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from .models import Match, Booking, UserProfile


# ─────────────────────────────────────────────
# 1. REGISTRATION FORM
# ─────────────────────────────────────────────
class RegisterForm(UserCreationForm):
    """
    Extended registration form.
    Clients register with email + password.
    Role is always 'client' for self-registration.
    """
    email      = forms.EmailField(required=True, label="Email Address")
    first_name = forms.CharField(max_length=50, required=True, label="First Name")
    last_name  = forms.CharField(max_length=50, required=True, label="Last Name")

    class Meta:
        model  = User
        fields = ['username', 'first_name', 'last_name', 'email',
                  'password1', 'password2']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Add Bootstrap classes to every field
        for field in self.fields.values():
            field.widget.attrs['class'] = 'form-control'

    def save(self, commit=True):
        """Save the user and auto-create a 'client' UserProfile."""
        user = super().save(commit=False)
        user.email      = self.cleaned_data['email']
        user.first_name = self.cleaned_data['first_name']
        user.last_name  = self.cleaned_data['last_name']
        if commit:
            user.save()
            # Create profile with client role
            UserProfile.objects.create(user=user, role='client')
        return user


# ─────────────────────────────────────────────
# 2. LOGIN FORM  (thin wrapper for consistent styling)
# ─────────────────────────────────────────────
class LoginForm(AuthenticationForm):
    """Login form with Bootstrap styling."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs['class'] = 'form-control'


# ─────────────────────────────────────────────
# 3. MATCH FORM  (admin creates / edits matches)
# ─────────────────────────────────────────────
class MatchForm(forms.ModelForm):
    """
    Form for creating or editing a Match.
    Used by Admin users only.
    """
    date = forms.DateField(
        widget=forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
        label="Match Date"
    )
    time = forms.TimeField(
        widget=forms.TimeInput(attrs={'type': 'time', 'class': 'form-control'}),
        label="Kickoff / Tip-off Time"
    )

    class Meta:
        model  = Match
        fields = [
            'title', 'sport_type', 'home_team', 'away_team',
            'date', 'time', 'location', 'latitude', 'longitude',
            'description', 'price', 'total_seats', 'image',
        ]
        widgets = {
            'title':       forms.TextInput(attrs={'class': 'form-control'}),
            'sport_type':  forms.Select(attrs={'class': 'form-select'}),
            'home_team':   forms.TextInput(attrs={'class': 'form-control'}),
            'away_team':   forms.TextInput(attrs={'class': 'form-control'}),
            'location':    forms.TextInput(attrs={'class': 'form-control'}),
            'latitude':    forms.NumberInput(attrs={'class': 'form-control', 'step': '0.000001',
                                                    'placeholder': 'e.g. 33.971590'}),
            'longitude':   forms.NumberInput(attrs={'class': 'form-control', 'step': '0.000001',
                                                    'placeholder': 'e.g. -6.849813'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'price':       forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'total_seats': forms.NumberInput(attrs={'class': 'form-control'}),
            'image':       forms.ClearableFileInput(attrs={'class': 'form-control'}),
        }

    def save(self, commit=True):
        """Set available_seats = total_seats on first creation."""
        match = super().save(commit=False)
        if not match.pk:
            # New match: all seats available
            match.available_seats = match.total_seats
        if commit:
            match.save()
        return match


# ─────────────────────────────────────────────
# 4. BOOKING FORM
# ─────────────────────────────────────────────
class BookingForm(forms.ModelForm):
    """
    Form for a client to book tickets for a match.
    Only shows the quantity field – price is computed in the view.
    """
    class Meta:
        model  = Booking
        fields = ['quantity']
        widgets = {
            'quantity': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 1,
                'max': 10,
                'value': 1,
            })
        }
        labels = {
            'quantity': 'Number of Tickets'
        }

    def __init__(self, *args, match=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.match = match
        if match:
            # Limit max quantity to available seats (max 10)
            max_qty = min(match.available_seats, 10)
            self.fields['quantity'].widget.attrs['max'] = max_qty

    def clean_quantity(self):
        qty = self.cleaned_data['quantity']
        if self.match and qty > self.match.available_seats:
            raise forms.ValidationError(
                f"Only {self.match.available_seats} seats are available."
            )
        if qty < 1:
            raise forms.ValidationError("You must book at least 1 ticket.")
        return qty


# ─────────────────────────────────────────────
# 5. USER PROFILE FORM
# ─────────────────────────────────────────────
class ProfileForm(forms.ModelForm):
    """Lets a user update their phone and bio."""
    first_name = forms.CharField(max_length=50, required=False,
                                 widget=forms.TextInput(attrs={'class': 'form-control'}))
    last_name  = forms.CharField(max_length=50, required=False,
                                 widget=forms.TextInput(attrs={'class': 'form-control'}))
    email      = forms.EmailField(required=False,
                                  widget=forms.EmailInput(attrs={'class': 'form-control'}))

    class Meta:
        model  = UserProfile
        fields = ['phone', 'bio']
        widgets = {
            'phone': forms.TextInput(attrs={'class': 'form-control'}),
            'bio':   forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }

    def __init__(self, *args, user=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.user_obj = user
        if user:
            self.fields['first_name'].initial = user.first_name
            self.fields['last_name'].initial  = user.last_name
            self.fields['email'].initial      = user.email

    def save(self, commit=True):
        profile = super().save(commit=False)
        if self.user_obj:
            self.user_obj.first_name = self.cleaned_data.get('first_name', '')
            self.user_obj.last_name  = self.cleaned_data.get('last_name', '')
            self.user_obj.email      = self.cleaned_data.get('email', '')
            if commit:
                self.user_obj.save()
        if commit:
            profile.save()
        return profile
