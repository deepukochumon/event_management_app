from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Attendee, Event, Registration, Venue
from .serializers import AttendeeSerializer, EventSerializer, RegistrationSerializer, VenueSerializer


class IsOrganizerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return hasattr(obj, "organizer") and obj.organizer == request.user


class VenueViewSet(viewsets.ModelViewSet):
    queryset = Venue.objects.all()
    serializer_class = VenueSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    search_fields = ["name", "city", "country"]
    ordering_fields = ["name", "capacity", "created_at"]


class AttendeeViewSet(viewsets.ModelViewSet):
    queryset = Attendee.objects.select_related("user").all()
    serializer_class = AttendeeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["company"]
    search_fields = ["user__first_name", "user__last_name", "user__email", "company"]
    ordering_fields = ["created_at", "updated_at"]

    def perform_create(self, serializer):
        serializer.save()


class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOrganizerOrReadOnly]
    filterset_fields = ["status", "venue"]
    search_fields = ["title", "description", "venue__name", "venue__city"]
    ordering_fields = ["starts_at", "ends_at", "created_at", "title", "price"]

    def get_queryset(self):
        qs = Event.objects.select_related("venue", "organizer").annotate(
            registrations_count=Count("registrations", distinct=True),
            attendees_count=Count("registrations__attendee", distinct=True),
        )
        params = self.request.query_params
        q = params.get("q")
        status_filter = params.get("status")
        venue = params.get("venue")
        start_date = params.get("start_date")
        end_date = params.get("end_date")
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q) | Q(venue__name__icontains=q))
        if status_filter:
            qs = qs.filter(status=status_filter)
        if venue:
            qs = qs.filter(venue_id=venue)
        if start_date:
            qs = qs.filter(starts_at__date__gte=start_date)
        if end_date:
            qs = qs.filter(ends_at__date__lte=end_date)
        return qs

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=["get"])
    def registrations(self, request, pk=None):
        event = self.get_object()
        serializer = RegistrationSerializer(event.registrations.select_related("attendee__user", "event"), many=True)
        return Response(serializer.data)


class RegistrationViewSet(viewsets.ModelViewSet):
    queryset = Registration.objects.select_related("event", "attendee__user").all()
    serializer_class = RegistrationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["status", "event", "attendee"]
    ordering_fields = ["created_at", "updated_at", "checked_in_at"]


class DashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        upcoming_events = Event.objects.filter(starts_at__gte=now).count()
        registrations = Registration.objects.count()
        active_events = Event.objects.filter(status=Event.Status.PUBLISHED, starts_at__gte=now).count()
        upcoming = Event.objects.select_related("venue").filter(starts_at__gte=now).order_by("starts_at")[:5]
        recent_regs = Registration.objects.select_related("event", "attendee__user").order_by("-created_at")[:5]
        stats = {
            "upcoming_events": upcoming_events,
            "registrations": registrations,
            "active_events": active_events,
            "venues": Venue.objects.count(),
            "attendees": Attendee.objects.count(),
        }
        return Response({
            "stats": stats,
            "upcoming_events": EventSerializer(upcoming, many=True, context={"request": request}).data,
            "recent_registrations": RegistrationSerializer(recent_regs, many=True, context={"request": request}).data,
        })
