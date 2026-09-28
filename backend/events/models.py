from django.conf import settings
from django.db import models
from django.utils import timezone


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Venue(TimeStampedModel):
    name = models.CharField(max_length=200)
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=120, blank=True)
    state = models.CharField(max_length=120, blank=True)
    country = models.CharField(max_length=120, blank=True)
    capacity = models.PositiveIntegerField(default=0)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Event(TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        CANCELLED = "cancelled", "Cancelled"
        COMPLETED = "completed", "Completed"

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    description = models.TextField(blank=True)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    venue = models.ForeignKey(Venue, on_delete=models.SET_NULL, null=True, blank=True, related_name="events")
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="organized_events"
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    max_attendees = models.PositiveIntegerField(default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    image_url = models.URLField(blank=True)

    class Meta:
        ordering = ["starts_at", "title"]

    def __str__(self):
        return self.title

    @property
    def is_upcoming(self):
        return self.starts_at >= timezone.now()


class Attendee(TimeStampedModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="attendee_profile")
    phone = models.CharField(max_length=30, blank=True)
    company = models.CharField(max_length=150, blank=True)
    bio = models.TextField(blank=True)

    def __str__(self):
        return self.user.get_full_name() or self.user.get_username()


class Registration(TimeStampedModel):
    class Status(models.TextChoices):
        REGISTERED = "registered", "Registered"
        CANCELLED = "cancelled", "Cancelled"
        CHECKED_IN = "checked_in", "Checked In"

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="registrations")
    attendee = models.ForeignKey(Attendee, on_delete=models.CASCADE, related_name="registrations")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.REGISTERED)
    notes = models.TextField(blank=True)
    checked_in_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("event", "attendee")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.attendee} -> {self.event}"
