from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import Appointment, AppointmentSlot, GalleryImage, Sale
from .permissions import IsAdminOrReadOnly, IsStaffAdmin
from .serializers import (
    AppointmentRequestSerializer,
    AppointmentSerializer,
    AppointmentSlotSerializer,
    ContactSerializer,
    GalleryImageSerializer,
    LoginSerializer,
    PublicAppointmentSerializer,
    SaleSerializer,
    UserSerializer,
    get_end_at,
)


def consume_appointment_slots(appointment):
    AppointmentSlot.objects.filter(
        starts_at__gte=appointment.scheduled_at,
        starts_at__lt=get_end_at(appointment.scheduled_at, appointment.duration_minutes),
    ).delete()


def restore_appointment_start_slot(appointment):
    AppointmentSlot.objects.get_or_create(
        starts_at=appointment.scheduled_at,
        defaults={'duration_minutes': 60},
    )


def send_appointment_request_email(appointment):
    send_mail(
        subject='Nouvelle demande de rendez-vous',
        message="\n".join(
            [
                'Une nouvelle demande de rendez-vous a ete deposee.',
                '',
                f"Nom : {appointment.customer_name}",
                f"Telephone : {appointment.customer_phone}",
                f"Email : {appointment.customer_email}",
                f"Creneau : {appointment.scheduled_at:%d/%m/%Y a %H:%M}",
                f"Objet : {appointment.title}",
                '',
                'Message :',
                appointment.notes or '-',
            ]
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[settings.CONTACT_RECIPIENT_EMAIL],
        fail_silently=False,
    )


def send_appointment_confirmation_email(appointment):
    if not appointment.customer_email:
        return

    send_mail(
        subject='Votre rendez-vous est confirme',
        message="\n".join(
            [
                f"Bonjour {appointment.customer_name or ''}".strip() + ',',
                '',
                'Votre demande de rendez-vous a ete acceptee.',
                f"Creneau : {appointment.scheduled_at:%d/%m/%Y a %H:%M}",
                f"Duree : {appointment.duration_minutes // 60}h",
                f"Objet : {appointment.title}",
                '',
                'RC services',
            ]
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[appointment.customer_email],
        fail_silently=False,
    )


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        Token.objects.filter(user=user).delete()
        token = Token.objects.create(user=user)

        return Response(
            {
                'token': token.key,
                'token_type': 'Bearer',
                'expires_in_hours': settings.API_TOKEN_TTL_HOURS,
                'user': UserSerializer(user).data,
            }
        )


class LogoutView(APIView):
    permission_classes = [IsStaffAdmin]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsStaffAdmin]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ContactView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'contact'

    def post(self, request):
        serializer = ContactSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        contact = serializer.validated_data

        subject = f"Demande de devis - {contact['service']}"
        body = "\n".join(
            [
                f"Nom : {contact['name']}",
                f"Telephone : {contact['phone']}",
                f"Email : {contact['email']}",
                f"Service : {contact['service']}",
                '',
                'Message :',
                contact['message'],
            ]
        )

        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.CONTACT_RECIPIENT_EMAIL],
            fail_silently=False,
        )

        return Response({'detail': 'Message envoye.'}, status=status.HTTP_201_CREATED)


class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [IsAdminOrReadOnly]
    parser_classes = [JSONParser, MultiPartParser, FormParser]


class GalleryImageViewSet(viewsets.ModelViewSet):
    queryset = GalleryImage.objects.all()
    serializer_class = GalleryImageSerializer
    permission_classes = [IsAdminOrReadOnly]
    parser_classes = [JSONParser, MultiPartParser, FormParser]


class AppointmentSlotViewSet(viewsets.ModelViewSet):
    queryset = AppointmentSlot.objects.all()
    serializer_class = AppointmentSlotSerializer
    permission_classes = [IsStaffAdmin]


class AppointmentAvailabilityView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        slots = AppointmentSlot.objects.all()
        appointments = Appointment.objects.filter(
            status__in=[Appointment.Status.PENDING, Appointment.Status.CONFIRMED],
        )
        return Response(
            {
                'slots': AppointmentSlotSerializer(slots, many=True).data,
                'appointments': PublicAppointmentSerializer(appointments, many=True).data,
            }
        )


class AppointmentRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'appointment'

    def post(self, request):
        serializer = AppointmentRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            appointment = serializer.save(status=Appointment.Status.PENDING)
            consume_appointment_slots(appointment)
        send_appointment_request_email(appointment)
        return Response(
            AppointmentRequestSerializer(appointment).data,
            status=status.HTTP_201_CREATED,
        )


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsStaffAdmin]

    def perform_create(self, serializer):
        with transaction.atomic():
            appointment = serializer.save()
            consume_appointment_slots(appointment)

    def perform_update(self, serializer):
        with transaction.atomic():
            previous = self.get_object()
            previous_starts_at = previous.scheduled_at
            appointment = serializer.save()
            if previous_starts_at != appointment.scheduled_at:
                AppointmentSlot.objects.get_or_create(
                    starts_at=previous_starts_at,
                    defaults={'duration_minutes': 60},
                )
            consume_appointment_slots(appointment)

    @action(detail=True, methods=['post'])
    def validate(self, request, pk=None):
        with transaction.atomic():
            appointment = self.get_object()
            serializer = self.get_serializer(appointment, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            appointment = serializer.save(status=Appointment.Status.CONFIRMED)
            consume_appointment_slots(appointment)
        send_appointment_confirmation_email(appointment)
        return Response(self.get_serializer(appointment).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        with transaction.atomic():
            appointment = self.get_object()
            restore_appointment_start_slot(appointment)
            appointment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
