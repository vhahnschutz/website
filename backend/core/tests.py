from django.contrib.auth import get_user_model
from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from .models import Appointment, AppointmentSlot, GalleryImage, Sale


class ApiTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.admin = User.objects.create_user(
            username='admin',
            password='StrongPassword123!',
            is_staff=True,
        )
        self.user = User.objects.create_user(
            username='user',
            password='StrongPassword123!',
        )
        self.client = APIClient()

    def test_sales_are_publicly_readable(self):
        Sale.objects.create(
            title='Velo occasion',
            description='Bon etat',
            price='120.00',
            photo=SimpleUploadedFile('velo.jpg', b'file', content_type='image/jpeg'),
        )

        response = self.client.get('/api/sales/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['title'], 'Velo occasion')

    def test_non_staff_user_cannot_login(self):
        response = self.client.post(
            '/api/auth/login/',
            {'username': 'user', 'password': 'StrongPassword123!'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_login_and_create_sale(self):
        login_response = self.client.post(
            '/api/auth/login/',
            {'username': 'admin', 'password': 'StrongPassword123!'},
            format='json',
        )
        token = login_response.data['token']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.post(
            '/api/sales/',
            {
                'title': 'Piece neuve',
                'description': 'Compatible route',
                'price': '35.50',
                'photo': SimpleUploadedFile('piece.png', b'file', content_type='image/png'),
                'is_sold': False,
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Sale.objects.count(), 1)

    def test_anonymous_user_cannot_write_sales(self):
        sale = Sale.objects.create(
            title='Velo occasion',
            description='Bon etat',
            price='120.00',
            photo=SimpleUploadedFile('velo.jpg', b'file', content_type='image/jpeg'),
        )

        create_response = self.client.post(
            '/api/sales/',
            {
                'title': 'Piece neuve',
                'description': 'Compatible route',
                'price': '35.50',
                'photo': SimpleUploadedFile('piece.png', b'file', content_type='image/png'),
            },
            format='multipart',
        )
        update_response = self.client.patch(
            f'/api/sales/{sale.id}/',
            {'title': 'Modification interdite'},
            format='json',
        )
        delete_response = self.client.delete(f'/api/sales/{sale.id}/')

        self.assertEqual(create_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(update_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(delete_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_staff_user_cannot_write_sales(self):
        sale = Sale.objects.create(
            title='Velo occasion',
            description='Bon etat',
            price='120.00',
            photo=SimpleUploadedFile('velo.jpg', b'file', content_type='image/jpeg'),
        )
        self.client.force_authenticate(user=self.user)

        update_response = self.client.patch(
            f'/api/sales/{sale.id}/',
            {'title': 'Modification interdite'},
            format='json',
        )
        delete_response = self.client.delete(f'/api/sales/{sale.id}/')

        self.assertEqual(update_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(delete_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_gallery_images_are_publicly_readable(self):
        GalleryImage.objects.create(
            title='Atelier',
            photo=SimpleUploadedFile('atelier.jpg', b'file', content_type='image/jpeg'),
        )

        response = self.client.get('/api/gallery-images/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['title'], 'Atelier')
        self.assertIn('photo_url', response.data[0])

    def test_admin_can_create_gallery_image(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            '/api/gallery-images/',
            {
                'title': 'Revision tondeuse',
                'photo': SimpleUploadedFile('revision.png', b'file', content_type='image/png'),
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(GalleryImage.objects.count(), 1)

    def test_anonymous_user_cannot_write_gallery_images(self):
        image = GalleryImage.objects.create(
            title='Atelier',
            photo=SimpleUploadedFile('atelier.jpg', b'file', content_type='image/jpeg'),
        )

        create_response = self.client.post(
            '/api/gallery-images/',
            {
                'title': 'Interdite',
                'photo': SimpleUploadedFile('photo.png', b'file', content_type='image/png'),
            },
            format='multipart',
        )
        delete_response = self.client.delete(f'/api/gallery-images/{image.id}/')

        self.assertEqual(create_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(delete_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_can_validate_appointment(self):
        appointment = Appointment.objects.create(
            title='Diagnostic',
            scheduled_at=timezone.now(),
        )
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(f'/api/appointments/{appointment.id}/validate/')

        appointment.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(appointment.status, Appointment.Status.CONFIRMED)

    def test_admin_cancel_appointment_deletes_it(self):
        appointment = Appointment.objects.create(
            title='Diagnostic',
            scheduled_at='2026-06-01T08:00:00Z',
        )
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(f'/api/appointments/{appointment.id}/cancel/')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Appointment.objects.filter(id=appointment.id).exists())
        self.assertTrue(AppointmentSlot.objects.filter(starts_at='2026-06-01T08:00:00Z').exists())

    def test_public_user_can_request_appointment(self):
        AppointmentSlot.objects.create(starts_at='2026-06-01T08:00:00Z')

        response = self.client.post(
            '/api/appointments/request/',
            {
                'title': 'Entretien tondeuse',
                'customer_name': 'Victor',
                'customer_email': 'victor@example.com',
                'customer_phone': '0600000000',
                'scheduled_at': '2026-06-01T10:00:00+02:00',
                'notes': 'Revision annuelle',
                'privacyAccepted': True,
                'humanConfirmed': True,
                'website': '',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Appointment.objects.count(), 1)
        self.assertEqual(Appointment.objects.first().status, Appointment.Status.PENDING)
        self.assertEqual(Appointment.objects.first().duration_minutes, 60)

    def test_public_user_cannot_request_closed_slot(self):
        response = self.client.post(
            '/api/appointments/request/',
            {
                'title': 'Entretien tondeuse',
                'customer_name': 'Victor',
                'customer_email': 'victor@example.com',
                'customer_phone': '0600000000',
                'scheduled_at': '2026-06-01T10:00:00+02:00',
                'notes': 'Revision annuelle',
                'privacyAccepted': True,
                'humanConfirmed': True,
                'website': '',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Appointment.objects.count(), 0)

    def test_public_availability_hides_customer_information(self):
        Appointment.objects.create(
            title='Diagnostic',
            customer_name='Victor',
            customer_email='victor@example.com',
            customer_phone='0600000000',
            scheduled_at=timezone.now(),
        )

        response = self.client.get('/api/appointments/availability/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('scheduled_at', response.data['appointments'][0])
        self.assertNotIn('customer_email', response.data['appointments'][0])
        self.assertNotIn('customer_phone', response.data['appointments'][0])

    def test_public_user_cannot_request_taken_slot(self):
        AppointmentSlot.objects.create(starts_at='2026-06-01T08:00:00Z')
        Appointment.objects.create(
            title='Diagnostic',
            scheduled_at='2026-06-01T08:00:00Z',
        )

        response = self.client.post(
            '/api/appointments/request/',
            {
                'title': 'Entretien tondeuse',
                'customer_name': 'Victor',
                'customer_email': 'victor@example.com',
                'customer_phone': '0600000000',
                'scheduled_at': '2026-06-01T10:00:00+02:00',
                'notes': '',
                'privacyAccepted': True,
                'humanConfirmed': True,
                'website': '',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_public_user_cannot_request_outside_opening_hours(self):
        before_opening_response = self.client.post(
            '/api/appointments/request/',
            {
                'title': 'Entretien tondeuse',
                'customer_name': 'Victor',
                'customer_email': 'victor@example.com',
                'customer_phone': '0600000000',
                'scheduled_at': '2026-06-08T07:00:00+02:00',
                'notes': '',
                'privacyAccepted': True,
                'humanConfirmed': True,
                'website': '',
            },
            format='json',
        )
        after_opening_response = self.client.post(
            '/api/appointments/request/',
            {
                'title': 'Entretien tondeuse',
                'customer_name': 'Victor',
                'customer_email': 'victor@example.com',
                'customer_phone': '0600000000',
                'scheduled_at': '2026-06-08T19:00:00+02:00',
                'notes': '',
                'privacyAccepted': True,
                'humanConfirmed': True,
                'website': '',
            },
            format='json',
        )
        half_hour_response = self.client.post(
            '/api/appointments/request/',
            {
                'title': 'Entretien tondeuse',
                'customer_name': 'Victor',
                'customer_email': 'victor@example.com',
                'customer_phone': '0600000000',
                'scheduled_at': '2026-06-08T10:30:00+02:00',
                'notes': '',
                'privacyAccepted': True,
                'humanConfirmed': True,
                'website': '',
            },
            format='json',
        )

        self.assertEqual(before_opening_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(after_opening_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(half_hour_response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_public_user_can_request_weekend_appointment(self):
        AppointmentSlot.objects.create(starts_at='2026-06-07T08:00:00Z')

        response = self.client.post(
            '/api/appointments/request/',
            {
                'title': 'Entretien tondeuse',
                'customer_name': 'Victor',
                'customer_email': 'victor@example.com',
                'customer_phone': '0600000000',
                'scheduled_at': '2026-06-07T10:00:00+02:00',
                'notes': '',
                'privacyAccepted': True,
                'humanConfirmed': True,
                'website': '',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_admin_cannot_move_appointment_outside_opening_hours(self):
        AppointmentSlot.objects.create(starts_at='2026-06-08T08:00:00Z')
        appointment = Appointment.objects.create(
            title='Diagnostic',
            scheduled_at='2026-06-08T08:00:00Z',
        )
        self.client.force_authenticate(user=self.admin)

        response = self.client.patch(
            f'/api/appointments/{appointment.id}/',
            {'scheduled_at': '2026-06-08T19:00:00+02:00'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_open_appointment_slot(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            '/api/appointment-slots/',
            {
                'starts_at': '2026-06-01T10:00:00+02:00',
                'duration_minutes': 60,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(AppointmentSlot.objects.count(), 1)

    def test_admin_can_extend_appointment_duration(self):
        AppointmentSlot.objects.create(starts_at='2026-06-08T08:00:00Z')
        AppointmentSlot.objects.create(starts_at='2026-06-08T09:00:00Z')
        AppointmentSlot.objects.create(starts_at='2026-06-08T10:00:00Z')
        appointment = Appointment.objects.create(
            title='Diagnostic',
            scheduled_at='2026-06-08T08:00:00Z',
        )
        self.client.force_authenticate(user=self.admin)

        response = self.client.patch(
            f'/api/appointments/{appointment.id}/',
            {'duration_minutes': 120},
            format='json',
        )

        appointment.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(appointment.duration_minutes, 120)
        self.assertFalse(AppointmentSlot.objects.filter(starts_at='2026-06-08T08:00:00Z').exists())
        self.assertFalse(AppointmentSlot.objects.filter(starts_at='2026-06-08T09:00:00Z').exists())
        self.assertTrue(AppointmentSlot.objects.filter(starts_at='2026-06-08T10:00:00Z').exists())

    def test_admin_can_validate_appointment_with_longer_duration(self):
        AppointmentSlot.objects.create(starts_at='2026-06-08T08:00:00Z')
        AppointmentSlot.objects.create(starts_at='2026-06-08T09:00:00Z')
        AppointmentSlot.objects.create(starts_at='2026-06-08T10:00:00Z')
        appointment = Appointment.objects.create(
            title='Diagnostic',
            customer_email='victor@example.com',
            scheduled_at='2026-06-08T08:00:00Z',
        )
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            f'/api/appointments/{appointment.id}/validate/',
            {
                'scheduled_at': '2026-06-08T10:00:00+02:00',
                'duration_minutes': 180,
            },
            format='json',
        )

        appointment.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(appointment.status, Appointment.Status.CONFIRMED)
        self.assertEqual(appointment.duration_minutes, 180)
        self.assertEqual(AppointmentSlot.objects.count(), 0)

    def test_admin_cannot_use_half_hour_duration(self):
        AppointmentSlot.objects.create(starts_at='2026-06-08T08:00:00Z')
        appointment = Appointment.objects.create(
            title='Diagnostic',
            scheduled_at='2026-06-08T08:00:00Z',
        )
        self.client.force_authenticate(user=self.admin)

        response = self.client.patch(
            f'/api/appointments/{appointment.id}/',
            {'duration_minutes': 90},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_public_request_consumes_open_slot(self):
        AppointmentSlot.objects.create(starts_at='2026-06-01T08:00:00Z')

        response = self.client.post(
            '/api/appointments/request/',
            {
                'title': 'Entretien tondeuse',
                'customer_name': 'Victor',
                'customer_email': 'victor@example.com',
                'customer_phone': '0600000000',
                'scheduled_at': '2026-06-01T10:00:00+02:00',
                'notes': '',
                'privacyAccepted': True,
                'humanConfirmed': True,
                'website': '',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(AppointmentSlot.objects.count(), 0)

    @override_settings(
        EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
        CONTACT_RECIPIENT_EMAIL='Rcservices68320@gmail.com',
    )
    def test_public_request_sends_admin_email(self):
        AppointmentSlot.objects.create(starts_at='2026-06-01T08:00:00Z')

        response = self.client.post(
            '/api/appointments/request/',
            {
                'title': 'Entretien tondeuse',
                'customer_name': 'Victor',
                'customer_email': 'victor@example.com',
                'customer_phone': '0600000000',
                'scheduled_at': '2026-06-01T10:00:00+02:00',
                'notes': 'Revision annuelle',
                'privacyAccepted': True,
                'humanConfirmed': True,
                'website': '',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['Rcservices68320@gmail.com'])
        self.assertIn('victor@example.com', mail.outbox[0].body)
        self.assertIn('0600000000', mail.outbox[0].body)

    @override_settings(
        EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
        DEFAULT_FROM_EMAIL='Rcservices68320@gmail.com',
    )
    def test_accepting_appointment_sends_confirmation_email(self):
        appointment = Appointment.objects.create(
            title='Diagnostic',
            customer_name='Victor',
            customer_email='victor@example.com',
            customer_phone='0600000000',
            scheduled_at=timezone.now(),
        )
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(f'/api/appointments/{appointment.id}/validate/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['victor@example.com'])
        self.assertIn('confirme', mail.outbox[0].subject)

    @override_settings(
        EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
        CONTACT_RECIPIENT_EMAIL='Rcservices68320@gmail.com',
    )
    def test_contact_form_sends_email(self):
        response = self.client.post(
            '/api/contact/',
            {
                'name': 'Victor',
                'phone': '0600000000',
                'email': 'victor@example.com',
                'service': 'Entretien et réparation',
                'message': 'Bonjour, je souhaite un devis.',
                'privacyAccepted': True,
                'humanConfirmed': True,
                'website': '',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['Rcservices68320@gmail.com'])
        self.assertIn('Victor', mail.outbox[0].body)

    def test_contact_form_rejects_honeypot_spam(self):
        response = self.client.post(
            '/api/contact/',
            {
                'name': 'Spam',
                'phone': '0600000000',
                'email': 'spam@example.com',
                'service': 'Autre demande',
                'message': 'Spam',
                'privacyAccepted': True,
                'humanConfirmed': True,
                'website': 'https://spam.example',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
