from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import exceptions
from rest_framework.authentication import TokenAuthentication


class BearerOrTokenAuthentication(TokenAuthentication):
    keyword = 'Bearer'

    def authenticate(self, request):
        bearer_auth = super().authenticate(request)
        if bearer_auth is not None:
            return bearer_auth

        original_keyword = self.keyword
        self.keyword = 'Token'
        try:
            return super().authenticate(request)
        finally:
            self.keyword = original_keyword

    def authenticate_credentials(self, key):
        user, token = super().authenticate_credentials(key)
        expires_at = token.created + timedelta(hours=settings.API_TOKEN_TTL_HOURS)

        if timezone.now() >= expires_at:
            token.delete()
            raise exceptions.AuthenticationFailed('Token expiré.')

        return user, token
