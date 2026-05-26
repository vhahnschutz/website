from getpass import getpass

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = 'Create or update the single site admin account.'

    def add_arguments(self, parser):
        parser.add_argument('--username', required=True)
        parser.add_argument('--email', default='')

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        password = getpass('Password: ')
        password_confirmation = getpass('Password confirmation: ')

        if password != password_confirmation:
            raise CommandError('Passwords do not match.')

        validate_password(password)

        User = get_user_model()
        user, created = User.objects.get_or_create(username=username)
        user.email = email
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(password)
        user.save()

        action = 'created' if created else 'updated'
        self.stdout.write(self.style.SUCCESS(f'Admin account {action}: {username}'))
