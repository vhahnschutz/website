from django.contrib import admin

from .models import Appointment, AppointmentSlot, GalleryImage, Sale


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ('title', 'price', 'is_sold', 'created_at')
    list_filter = ('is_sold',)
    search_fields = ('title', 'description')


@admin.register(GalleryImage)
class GalleryImageAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_at')
    search_fields = ('title',)


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'scheduled_at', 'duration_minutes', 'status', 'customer_name', 'customer_phone')
    list_filter = ('status', 'scheduled_at')
    search_fields = ('title', 'customer_name', 'customer_email', 'customer_phone')


@admin.register(AppointmentSlot)
class AppointmentSlotAdmin(admin.ModelAdmin):
    list_display = ('starts_at', 'duration_minutes', 'created_at')
    list_filter = ('starts_at',)
