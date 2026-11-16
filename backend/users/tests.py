import json
import re
from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import TestCase, override_settings

from .models import PasswordResetChallenge


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class PasswordResetCodeTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email="learner@example.com",
            username="learner",
            password="Original-password!74",
        )

    def post_json(self, path, payload):
        return self.client.post(
            path,
            data=json.dumps(payload),
            content_type="application/json",
        )

    def test_password_reset_requires_email_code_before_password_change(self):
        request_response = self.post_json(
            "/api/v1/auth/password-reset/",
            {"email": self.user.email},
        )
        self.assertEqual(request_response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)

        code = re.search(r"\b(\d{6})\b", mail.outbox[0].body).group(1)
        wrong_code = f"{(int(code) + 1) % 1_000_000:06d}"
        invalid_response = self.post_json(
            "/api/v1/auth/password-reset/verify/",
            {"email": self.user.email, "code": wrong_code},
        )
        self.assertEqual(invalid_response.status_code, 400)
        self.assertFalse(self.user.check_password("A-new-secure-password!96"))

        verify_response = self.post_json(
            "/api/v1/auth/password-reset/verify/",
            {"email": self.user.email, "code": code},
        )
        self.assertEqual(verify_response.status_code, 200)
        reset_token = verify_response.json()["resetToken"]

        reset_response = self.post_json(
            "/api/v1/auth/password-reset/confirm/",
            {"resetToken": reset_token, "password": "A-new-secure-password!96"},
        )
        self.assertEqual(reset_response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("A-new-secure-password!96"))

        replay_response = self.post_json(
            "/api/v1/auth/password-reset/confirm/",
            {"resetToken": reset_token, "password": "Another-new-password!97"},
        )
        self.assertEqual(replay_response.status_code, 400)

    def test_reset_request_does_not_disclose_unknown_email(self):
        known_response = self.post_json(
            "/api/v1/auth/password-reset/",
            {"email": self.user.email},
        )
        unknown_response = self.post_json(
            "/api/v1/auth/password-reset/",
            {"email": "unknown@example.com"},
        )
        self.assertEqual(known_response.status_code, unknown_response.status_code)
        self.assertEqual(known_response.json(), unknown_response.json())
        self.assertEqual(len(mail.outbox), 1)

    def test_reset_code_can_only_be_sent_after_cooldown(self):
        self.post_json("/api/v1/auth/password-reset/", {"email": self.user.email})
        challenge = PasswordResetChallenge.objects.get(user=self.user)
        with patch("users.views.timezone.now") as mocked_now:
            mocked_now.return_value = challenge.sent_at + timedelta(seconds=10)
            self.post_json("/api/v1/auth/password-reset/", {"email": self.user.email})
        self.assertEqual(len(mail.outbox), 1)
