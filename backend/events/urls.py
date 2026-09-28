from rest_framework.routers import DefaultRouter
from .views import VenueViewSet, EventViewSet, AttendeeViewSet, RegistrationViewSet

router = DefaultRouter()
router.register(r'venues', VenueViewSet, basename='venue')
router.register(r'events', EventViewSet, basename='event')
router.register(r'attendees', AttendeeViewSet, basename='attendee')
router.register(r'registrations', RegistrationViewSet, basename='registration')

urlpatterns = router.urls
