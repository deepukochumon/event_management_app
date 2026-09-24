from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from apps.events.views import AttendeeViewSet, DashboardAPIView, EventViewSet, RegistrationViewSet, VenueViewSet
from apps.core.views import UserViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'venues', VenueViewSet, basename='venue')
router.register(r'events', EventViewSet, basename='event')
router.register(r'attendees', AttendeeViewSet, basename='attendee')
router.register(r'registrations', RegistrationViewSet, basename='registration')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/dashboard/', DashboardAPIView.as_view(), name='dashboard'),
    path('api/', include(router.urls)),
]
