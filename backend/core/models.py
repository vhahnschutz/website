from django.core.validators import FileExtensionValidator, MinValueValidator
from django.db import models


class Sale(models.Model):
    title = models.CharField(max_length=160)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    photo = models.FileField(
        upload_to='sales/',
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png', 'webp'])],
    )
    is_sold = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class GalleryImage(models.Model):
    title = models.CharField(max_length=160)
    photo = models.FileField(
        upload_to='gallery/',
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png', 'webp'])],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class AppointmentSlot(models.Model):
    starts_at = models.DateTimeField(unique=True)
    duration_minutes = models.PositiveIntegerField(default=60, validators=[MinValueValidator(60)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['starts_at']

    def __str__(self):
        return f'{self.starts_at:%d/%m/%Y %H:%M} ({self.duration_minutes} min)'


class Appointment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'En attente'
        CONFIRMED = 'confirmed', 'Validé'
        CANCELLED = 'cancelled', 'Annulé'

    title = models.CharField(max_length=160)
    customer_name = models.CharField(max_length=160, blank=True)
    customer_email = models.EmailField(blank=True)
    customer_phone = models.CharField(max_length=40, blank=True)
    scheduled_at = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=60, validators=[MinValueValidator(60)])
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['scheduled_at']

    def __str__(self):
        return f'{self.title} - {self.scheduled_at:%d/%m/%Y %H:%M}'
