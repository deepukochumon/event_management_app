from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AttendeeViewSet, DashboardView, EventViewSet, RegistrationViewSet, VenueViewSet

router = DefaultRouter()
router.register(r'venues', VenueViewSet, basename='venue')
router.register(r'attendees', AttendeeViewSet, basename='attendee')
router.register(r'events', EventViewSet, basename='event')
router.register(r'registrations', RegistrationViewSet, basename='registration')

urlpatterns = [
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('', include(router.urls)),
]
