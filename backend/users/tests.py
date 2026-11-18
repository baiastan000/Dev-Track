import json
import re
import smtplib
from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import TestCase, override_settings

from .models import PasswordResetChallenge


class RegistrationLoginTests(TestCase):
    def post_json(self, path, payload):
        return self.client.post(
            path,
            data=json.dumps(payload),
            content_type="application/json",
        )

    def test_registered_email_and_password_can_sign_in_again(self):
        email = "learner@example.com"
        password = "Correct horse! Battery-2026"
        registration_response = self.post_json(
            "/api/v1/auth/register/",
            {
                "email": "Learner@Example.com",
                "display_name": "Learner",
                "password": password,
            },
        )
        self.assertEqual(registration_response.status_code, 201)

        user = get_user_model().objects.get(email=email)
        self.assertTrue(user.check_password(password))
        self.post_json("/api/v1/auth/logout/", {})

        login_response = self.post_json(
            "/api/v1/auth/login/",
            {"email": "LEARNER@EXAMPLE.COM", "password": password},
        )
        self.assertEqual(login_response.status_code, 200)
        self.assertEqual(login_response.json()["user"]["email"], email)

    def test_sign_in_accepts_email_case_used_by_existing_account(self):
        user = get_user_model().objects.create_user(
            email="learner@example.com",
            username="learner",
            password="Original-password!74",
        )
        get_user_model().objects.filter(pk=user.pk).update(email="Learner@Example.com")

        response = self.post_json(
            "/api/v1/auth/login/",
            {"email": "learner@example.com", "password": "Original-password!74"},
        )
        self.assertEqual(response.status_code, 200)


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

    @patch("users.views.send_mail", side_effect=smtplib.SMTPException("delivery failed"))
    def test_email_delivery_failure_returns_a_clear_error(self, _send_mail):
        response = self.post_json(
            "/api/v1/auth/password-reset/",
            {"email": self.user.email},
        )
        self.assertEqual(response.status_code, 503)
        self.assertIn("verification email", response.json()["detail"])
        self.assertFalse(PasswordResetChallenge.objects.filter(user=self.user).exists())

    def test_reset_code_can_only_be_sent_after_cooldown(self):
        self.post_json("/api/v1/auth/password-reset/", {"email": self.user.email})
        challenge = PasswordResetChallenge.objects.get(user=self.user)
        with patch("users.views.timezone.now") as mocked_now:
            mocked_now.return_value = challenge.sent_at + timedelta(seconds=10)
            self.post_json("/api/v1/auth/password-reset/", {"email": self.user.email})
        self.assertEqual(len(mail.outbox), 1)
