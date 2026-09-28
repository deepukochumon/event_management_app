from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Venue, Event, Attendee, Registration
from .serializers import VenueSerializer, EventSerializer, AttendeeSerializer, RegistrationSerializer


class BaseModelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]


class VenueViewSet(BaseModelViewSet):
    queryset = Venue.objects.annotate(event_count=Count("events", distinct=True))
    serializer_class = VenueSerializer
    search_fields = ["name", "city", "country"]
    ordering_fields = ["name", "city", "capacity", "created_at"]


class EventViewSet(BaseModelViewSet):
    serializer_class = EventSerializer
    search_fields = ["title", "description", "event_type", "status", "venue__name", "venue__city"]
    ordering_fields = ["title", "start_datetime", "end_datetime", "created_at", "price", "status"]

    def get_queryset(self):
        queryset = Event.objects.select_related("venue", "created_by").annotate(
            registrations_count=Count("registrations", distinct=True),
            attendees_count=Count("registrations__attendee", distinct=True),
        )
        params = self.request.query_params
        if params.get("status"):
            queryset = queryset.filter(status=params["status"])
        if params.get("event_type"):
            queryset = queryset.filter(event_type=params["event_type"])
        if params.get("venue"):
            queryset = queryset.filter(venue_id=params["venue"])
        if params.get("start_date"):
            queryset = queryset.filter(start_datetime__date__gte=params["start_date"])
        if params.get("end_date"):
            queryset = queryset.filter(start_datetime__date__lte=params["end_date"])
        if params.get("upcoming") == "true":
            queryset = queryset.filter(start_datetime__gte=timezone.now())
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"])
    def dashboard(self, request):
        now = timezone.now()
        upcoming_events = self.get_queryset().filter(start_datetime__gte=now, status="published")[:5]
        stats = {
            "total_events": Event.objects.count(),
            "upcoming_events": Event.objects.filter(start_datetime__gte=now, status="published").count(),
            "total_registrations": Registration.objects.count(),
            "total_attendees": Attendee.objects.count(),
            "venues": Venue.objects.count(),
        }
        return Response({
            "stats": stats,
            "upcoming_events": EventSerializer(upcoming_events, many=True, context={"request": request}).data,
        })

    @action(detail=False, methods=["get"])
    def calendar(self, request):
        qs = self.get_queryset().only("id", "title", "start_datetime", "end_datetime", "status")
        return Response(EventSerializer(qs, many=True, context={"request": request}).data)


class AttendeeViewSet(BaseModelViewSet):
    queryset = Attendee.objects.select_related("user")
    serializer_class = AttendeeSerializer
    search_fields = ["user__first_name", "user__last_name", "user__username", "company", "job_title"]
    ordering_fields = ["created_at", "company", "job_title"]


class RegistrationViewSet(BaseModelViewSet):
    queryset = Registration.objects.select_related("event", "attendee", "attendee__user")
    serializer_class = RegistrationSerializer
    search_fields = ["event__title", "attendee__user__username", "attendee__user__first_name", "attendee__user__last_name", "status"]
    ordering_fields = ["registered_at", "checked_in_at", "status"]

    def get_queryset(self):
        queryset = super().get_queryset()
        event_id = self.request.query_params.get("event")
        attendee_id = self.request.query_params.get("attendee")
        status_param = self.request.query_params.get("status")
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        if attendee_id:
            queryset = queryset.filter(attendee_id=attendee_id)
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset
