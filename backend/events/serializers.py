from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Venue, Event, Attendee, Registration

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email"]
        read_only_fields = ["id"]


class VenueSerializer(serializers.ModelSerializer):
    event_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Venue
        fields = ["id", "name", "address", "city", "state", "country", "capacity", "event_count", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class EventSerializer(serializers.ModelSerializer):
    venue_details = VenueSerializer(source="venue", read_only=True)
    created_by_details = UserSerializer(source="created_by", read_only=True)
    registrations_count = serializers.IntegerField(read_only=True)
    attendees_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Event
        fields = [
            "id", "title", "description", "event_type", "status", "venue", "venue_details",
            "start_datetime", "end_datetime", "capacity", "price", "created_by", "created_by_details",
            "registrations_count", "attendees_count", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_by_details", "registrations_count", "attendees_count", "created_at", "updated_at"]

    def validate(self, attrs):
        start = attrs.get("start_datetime", getattr(self.instance, "start_datetime", None))
        end = attrs.get("end_datetime", getattr(self.instance, "end_datetime", None))
        if start and end and end <= start:
            raise serializers.ValidationError({"end_datetime": "End time must be after start time."})
        return attrs


class AttendeeSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Attendee
        fields = ["id", "user", "full_name", "email", "phone", "company", "job_title", "bio", "created_at"]
        read_only_fields = ["id", "created_at", "full_name", "email"]

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class RegistrationSerializer(serializers.ModelSerializer):
    attendee_details = AttendeeSerializer(source="attendee", read_only=True)
    event_details = EventSerializer(source="event", read_only=True)

    class Meta:
        model = Registration
        fields = ["id", "event", "event_details", "attendee", "attendee_details", "status", "notes", "registered_at", "checked_in_at"]
        read_only_fields = ["id", "registered_at"]

    def validate(self, attrs):
        event = attrs.get("event", getattr(self.instance, "event", None))
        if event and event.status == "cancelled":
            raise serializers.ValidationError({"event": "Cannot register for a cancelled event."})
        return attrs
