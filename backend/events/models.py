from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator


class Venue(models.Model):
    name = models.CharField(max_length=200)
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=120)
    state = models.CharField(max_length=120, blank=True)
    country = models.CharField(max_length=120)
    capacity = models.PositiveIntegerField(default=0, validators=[MinValueValidator(0)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        unique_together = ("name", "address", "city")

    def __str__(self):
        return f"{self.name} ({self.city})"


class Event(models.Model):
    EVENT_TYPES = [
        ("conference", "Conference"),
        ("workshop", "Workshop"),
        ("meetup", "Meetup"),
        ("webinar", "Webinar"),
        ("other", "Other"),
    ]

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    event_type = models.CharField(max_length=30, choices=EVENT_TYPES, default="other")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    venue = models.ForeignKey(Venue, on_delete=models.SET_NULL, null=True, blank=True, related_name="events")
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    capacity = models.PositiveIntegerField(default=0, validators=[MinValueValidator(0)])
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="created_events")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["start_datetime", "title"]
        indexes = [
            models.Index(fields=["status", "start_datetime"]),
            models.Index(fields=["event_type", "start_datetime"]),
        ]

    def __str__(self):
        return self.title


class Attendee(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="attendee_profile")
    phone = models.CharField(max_length=30, blank=True)
    company = models.CharField(max_length=150, blank=True)
    job_title = models.CharField(max_length=150, blank=True)
    bio = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.get_full_name() or self.user.username


class Registration(models.Model):
    STATUS_CHOICES = [
        ("registered", "Registered"),
        ("checked_in", "Checked In"),
        ("cancelled", "Cancelled"),
    ]

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="registrations")
    attendee = models.ForeignKey(Attendee, on_delete=models.CASCADE, related_name="registrations")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="registered")
    notes = models.TextField(blank=True)
    registered_at = models.DateTimeField(auto_now_add=True)
    checked_in_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("event", "attendee")
        ordering = ["-registered_at"]

    def __str__(self):
        return f"{self.attendee} -> {self.event}"
