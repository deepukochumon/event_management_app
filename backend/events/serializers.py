from django.contrib.auth import get_user_model
from django.utils.text import slugify
from rest_framework import serializers

from .models import Attendee, Event, Registration, Venue

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "full_name"]
        read_only_fields = ["id", "full_name"]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.get_username()


class VenueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Venue
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class AttendeeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(source="user", queryset=User.objects.all(), write_only=True, required=False)

    class Meta:
        model = Attendee
        fields = ["id", "user", "user_id", "phone", "company", "bio", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at", "user"]


class EventSerializer(serializers.ModelSerializer):
    venue_detail = VenueSerializer(source="venue", read_only=True)
    organizer = UserSerializer(read_only=True)
    registrations_count = serializers.IntegerField(read_only=True)
    attendees_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Event
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "starts_at",
            "ends_at",
            "venue",
            "venue_detail",
            "organizer",
            "status",
            "max_attendees",
            "price",
            "image_url",
            "registrations_count",
            "attendees_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "organizer", "created_at", "updated_at", "registrations_count", "attendees_count"]

    def validate(self, attrs):
        starts_at = attrs.get("starts_at", getattr(self.instance, "starts_at", None))
        ends_at = attrs.get("ends_at", getattr(self.instance, "ends_at", None))
        if starts_at and ends_at and ends_at <= starts_at:
            raise serializers.ValidationError({"ends_at": "End time must be after start time."})
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        organizer = request.user if request and request.user.is_authenticated else None
        if not organizer:
            raise serializers.ValidationError("Authentication required to create an event.")
        title = validated_data["title"]
        base_slug = slugify(title)
        slug = base_slug
        index = 1
        while Event.objects.filter(slug=slug).exists():
            index += 1
            slug = f"{base_slug}-{index}"
        validated_data["slug"] = slug
        validated_data["organizer"] = organizer
        return super().create(validated_data)


class RegistrationSerializer(serializers.ModelSerializer):
    attendee_detail = AttendeeSerializer(source="attendee", read_only=True)
    event_detail = EventSerializer(source="event", read_only=True)

    class Meta:
        model = Registration
        fields = [
            "id",
            "event",
            "event_detail",
            "attendee",
            "attendee_detail",
            "status",
            "notes",
            "checked_in_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "checked_in_at", "created_at", "updated_at", "event_detail", "attendee_detail"]

    def validate(self, attrs):
        event = attrs.get("event", getattr(self.instance, "event", None))
        attendee = attrs.get("attendee", getattr(self.instance, "attendee", None))
        if event and attendee:
            if Registration.objects.filter(event=event, attendee=attendee).exclude(pk=getattr(self.instance, "pk", None)).exists():
                raise serializers.ValidationError("This attendee is already registered for the event.")
        return attrs
