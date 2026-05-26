from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AppointmentAvailabilityView,
    AppointmentSlotViewSet,
    AppointmentRequestView,
    AppointmentViewSet,
    ContactView,
    GalleryImageViewSet,
    LoginView,
    LogoutView,
    MeView,
    SaleViewSet,
)

router = DefaultRouter()
router.register('sales', SaleViewSet, basename='sale')
router.register('gallery-images', GalleryImageViewSet, basename='gallery-image')
router.register('appointment-slots', AppointmentSlotViewSet, basename='appointment-slot')
router.register('appointments', AppointmentViewSet, basename='appointment')

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/me/', MeView.as_view(), name='me'),
    path('contact/', ContactView.as_view(), name='contact'),
    path('appointments/availability/', AppointmentAvailabilityView.as_view(), name='appointment-availability'),
    path('appointments/request/', AppointmentRequestView.as_view(), name='appointment-request'),
    path('', include(router.urls)),
]
