from datetime import timedelta

from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework import serializers

from .models import Appointment, AppointmentSlot, GalleryImage, Sale


MAX_PHOTO_SIZE = 5 * 1024 * 1024


def get_end_at(starts_at, duration_minutes):
    return starts_at + timedelta(minutes=duration_minutes)


def validate_hour_duration(duration_minutes):
    if duration_minutes < 60 or duration_minutes % 60 != 0:
        raise serializers.ValidationError('La duree doit etre definie par tranche de 1h.')


def validate_hour_grid(starts_at):
    local_starts_at = timezone.localtime(starts_at)

    if local_starts_at.hour < 8 or local_starts_at.hour > 18:
        raise serializers.ValidationError('Les rendez-vous sont possibles tous les jours, de 8h a 19h.')

    if (
        local_starts_at.minute != 0
        or local_starts_at.second != 0
        or local_starts_at.microsecond != 0
    ):
        raise serializers.ValidationError('Les rendez-vous doivent commencer sur une tranche horaire pleine.')


def validate_appointment_slot(scheduled_at, duration_minutes=60, instance=None, require_open_slot=True):
    validate_hour_grid(scheduled_at)
    validate_hour_duration(duration_minutes)

    if require_open_slot and not AppointmentSlot.objects.filter(starts_at=scheduled_at).exists():
        raise serializers.ValidationError('Ce creneau n est pas ouvert a la prise de rendez-vous.')

    ends_at = get_end_at(scheduled_at, duration_minutes)
    existing_appointments = Appointment.objects.filter(
        status__in=[Appointment.Status.PENDING, Appointment.Status.CONFIRMED],
    )

    if instance is not None:
        existing_appointments = existing_appointments.exclude(pk=instance.pk)

    for appointment in existing_appointments:
        appointment_ends_at = get_end_at(appointment.scheduled_at, appointment.duration_minutes)
        if scheduled_at < appointment_ends_at and ends_at > appointment.scheduled_at:
            raise serializers.ValidationError('Ce creneau est deja demande ou reserve.')


def validate_availability_slot(starts_at, duration_minutes=60, instance=None):
    validate_hour_grid(starts_at)
    validate_hour_duration(duration_minutes)

    if duration_minutes != 60:
        raise serializers.ValidationError('Les creneaux ouverts doivent durer 1h.')

    existing_slots = AppointmentSlot.objects.filter(starts_at=starts_at)
    if instance is not None:
        existing_slots = existing_slots.exclude(pk=instance.pk)

    if existing_slots.exists():
        raise serializers.ValidationError('Ce creneau est deja ouvert.')

    ends_at = get_end_at(starts_at, duration_minutes)
    for appointment in Appointment.objects.filter(
        status__in=[Appointment.Status.PENDING, Appointment.Status.CONFIRMED],
    ):
        appointment_ends_at = get_end_at(appointment.scheduled_at, appointment.duration_minutes)
        if starts_at < appointment_ends_at and ends_at > appointment.scheduled_at:
            raise serializers.ValidationError('Ce creneau chevauche deja un rendez-vous.')


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(trim_whitespace=False, write_only=True)

    def validate(self, attrs):
        request = self.context.get('request')
        user = authenticate(
            request=request,
            username=attrs.get('username'),
            password=attrs.get('password'),
        )

        if user is None or not user.is_active or not user.is_staff:
            raise serializers.ValidationError('Identifiants invalides.')

        attrs['user'] = user
        return attrs


class UserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField(allow_blank=True)
    is_staff = serializers.BooleanField()


class ContactSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=160)
    phone = serializers.CharField(max_length=40)
    email = serializers.EmailField()
    service = serializers.CharField(max_length=120)
    message = serializers.CharField(max_length=3000)
    privacyAccepted = serializers.BooleanField()
    humanConfirmed = serializers.BooleanField()
    website = serializers.CharField(required=False, allow_blank=True, write_only=True)

    def validate(self, attrs):
        if not attrs.get('privacyAccepted'):
            raise serializers.ValidationError('La politique de confidentialite doit etre acceptee.')

        if not attrs.get('humanConfirmed'):
            raise serializers.ValidationError('La confirmation anti-spam est obligatoire.')

        if attrs.get('website'):
            raise serializers.ValidationError('Message refuse.')

        return attrs


class SaleSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        fields = [
            'id',
            'title',
            'description',
            'price',
            'photo',
            'photo_url',
            'is_sold',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'photo_url', 'created_at', 'updated_at']

    def get_photo_url(self, obj):
        if not obj.photo:
            return None

        request = self.context.get('request')
        url = obj.photo.url
        return request.build_absolute_uri(url) if request else url

    def validate_photo(self, photo):
        if photo.size > MAX_PHOTO_SIZE:
            raise serializers.ValidationError('La photo ne doit pas depasser 5 Mo.')
        return photo


class GalleryImageSerializer(serializers.ModelSerializer):
    title = serializers.CharField(
        max_length=160,
        error_messages={
            'blank': 'Le titre est obligatoire.',
            'max_length': 'Le titre ne doit pas depasser 160 caracteres.',
            'required': 'Le titre est obligatoire.',
        },
    )
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = GalleryImage
        fields = [
            'id',
            'title',
            'photo',
            'photo_url',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'photo_url', 'created_at', 'updated_at']

    def get_photo_url(self, obj):
        if not obj.photo:
            return None

        request = self.context.get('request')
        url = obj.photo.url
        return request.build_absolute_uri(url) if request else url

    def validate_photo(self, photo):
        if photo.size > MAX_PHOTO_SIZE:
            raise serializers.ValidationError('La photo ne doit pas depasser 5 Mo.')
        return photo


class AppointmentSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppointmentSlot
        fields = ['id', 'starts_at', 'duration_minutes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        starts_at = attrs.get('starts_at', getattr(self.instance, 'starts_at', None))
        duration_minutes = attrs.get('duration_minutes', getattr(self.instance, 'duration_minutes', 60))
        if starts_at:
            validate_availability_slot(starts_at, duration_minutes, self.instance)
        return attrs


class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = [
            'id',
            'title',
            'customer_name',
            'customer_email',
            'customer_phone',
            'scheduled_at',
            'duration_minutes',
            'status',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        scheduled_at = attrs.get('scheduled_at', getattr(self.instance, 'scheduled_at', None))
        duration_minutes = attrs.get('duration_minutes', getattr(self.instance, 'duration_minutes', 60))
        should_validate_slot = (
            self.instance is None
            or 'scheduled_at' in attrs
            or 'duration_minutes' in attrs
        )
        if scheduled_at and should_validate_slot:
            scheduled_at_changed = (
                self.instance is not None
                and 'scheduled_at' in attrs
                and scheduled_at != self.instance.scheduled_at
            )
            require_open_slot = self.instance is None or scheduled_at_changed
            validate_appointment_slot(
                scheduled_at,
                duration_minutes,
                self.instance,
                require_open_slot=require_open_slot,
            )
        return attrs


class PublicAppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ['id', 'title', 'scheduled_at', 'duration_minutes', 'status']


class AppointmentRequestSerializer(serializers.ModelSerializer):
    privacyAccepted = serializers.BooleanField(write_only=True)
    humanConfirmed = serializers.BooleanField(write_only=True)
    website = serializers.CharField(required=False, allow_blank=True, write_only=True)
    customer_email = serializers.EmailField(required=True, allow_blank=False)

    class Meta:
        model = Appointment
        fields = [
            'id',
            'title',
            'customer_name',
            'customer_email',
            'customer_phone',
            'scheduled_at',
            'duration_minutes',
            'notes',
            'privacyAccepted',
            'humanConfirmed',
            'website',
        ]
        read_only_fields = ['id', 'duration_minutes']

    def validate(self, attrs):
        if not attrs.get('privacyAccepted'):
            raise serializers.ValidationError('La politique de confidentialite doit etre acceptee.')

        if not attrs.get('humanConfirmed'):
            raise serializers.ValidationError('La confirmation anti-spam est obligatoire.')

        if attrs.get('website'):
            raise serializers.ValidationError('Demande refusee.')

        scheduled_at = attrs.get('scheduled_at')
        if scheduled_at:
            validate_appointment_slot(scheduled_at, 60)
            attrs['duration_minutes'] = 60

        return attrs

    def create(self, validated_data):
        validated_data.pop('privacyAccepted', None)
        validated_data.pop('humanConfirmed', None)
        validated_data.pop('website', None)
        return super().create(validated_data)
