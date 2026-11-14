import json
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import patch
from uuid import uuid4

from django.test import SimpleTestCase, TestCase, override_settings
from rest_framework.test import APIClient

from .models import CourseOrder
from .telegram import (
    TelegramConfigurationError,
    TelegramDeliveryError,
    send_order_notification,
)


class TelegramClientTests(SimpleTestCase):
    @override_settings(TELEGRAM_BOT_TOKEN="123:secret", TELEGRAM_CHAT_ID="7674763924")
    @patch("payments.telegram.urlopen")
    def test_sends_order_details_to_configured_chat(self, urlopen_mock):
        response = SimpleNamespace(
            read=lambda: b'{"ok":true,"result":{"message_id":456}}'
        )
        urlopen_mock.return_value.__enter__.return_value = response
        urlopen_mock.return_value.__exit__.return_value = None
        order = SimpleNamespace(
            pk=uuid4(),
            customer_name="Aida Example",
            customer_email="aida@example.com",
            items=[{"title": "JavaScript", "quantity": 2}],
            total=Decimal("5000.00"),
        )

        message_id = send_order_notification(order)

        request = urlopen_mock.call_args.args[0]
        self.assertIn("api.telegram.org/bot123:secret/sendMessage", request.full_url)
        payload = json.loads(request.data)
        self.assertEqual(payload["chat_id"], "7674763924")
        self.assertIn("Aida Example", payload["text"])
        self.assertIn("aida@example.com", payload["text"])
        self.assertIn("JavaScript × 2", payload["text"])
        self.assertIn("5000.00 KGS", payload["text"])
        self.assertEqual(message_id, "456")

    @override_settings(TELEGRAM_BOT_TOKEN="", TELEGRAM_CHAT_ID="")
    def test_missing_bot_credentials_raise_configuration_error(self):
        with self.assertRaises(TelegramConfigurationError):
            send_order_notification(SimpleNamespace())

    @override_settings(TELEGRAM_BOT_TOKEN="123:secret", TELEGRAM_CHAT_ID="7674763924")
    @patch("payments.telegram.urlopen")
    def test_telegram_api_rejection_is_reported_as_delivery_failure(self, urlopen_mock):
        response = SimpleNamespace(
            read=lambda: b'{"ok":false,"error_code":400}'
        )
        urlopen_mock.return_value.__enter__.return_value = response
        urlopen_mock.return_value.__exit__.return_value = None
        order = SimpleNamespace(
            pk=uuid4(),
            customer_name="Aida Example",
            customer_email="aida@example.com",
            items=[{"title": "JavaScript", "quantity": 1}],
            total=Decimal("2500.00"),
        )

        with self.assertLogs("payments.telegram", level="ERROR"):
            with self.assertRaises(TelegramDeliveryError):
                send_order_notification(order)


class CourseOrderApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.payload = {
            "idempotency_key": str(uuid4()),
            "customer_name": "Aida Example",
            "customer_email": "aida@example.com",
            "items": [
                {
                    "course_id": "javascript",
                    "title": "JavaScript",
                    "unit_price": "2500.00",
                    "quantity": 2,
                }
            ],
        }

    @patch("payments.order_views.send_order_notification", return_value="123456")
    def test_order_is_saved_and_sent_by_the_server(self, send_notification):
        response = self.client.post("/api/v1/orders/", self.payload, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["total"], "5000.00")
        self.assertEqual(response.data["customer"]["name"], "Aida Example")
        self.assertEqual(CourseOrder.objects.count(), 1)
        self.assertEqual(response.data["notification_status"], CourseOrder.NotificationStatus.ACCEPTED)
        send_notification.assert_called_once()

    @patch("payments.order_views.send_order_notification", return_value="123456")
    def test_retry_after_success_does_not_send_a_duplicate(self, send_notification):
        first_response = self.client.post("/api/v1/orders/", self.payload, format="json")
        retry_response = self.client.post("/api/v1/orders/", self.payload, format="json")

        self.assertEqual(first_response.status_code, 201)
        self.assertEqual(retry_response.status_code, 200)
        self.assertEqual(retry_response.data["id"], first_response.data["id"])
        send_notification.assert_called_once()

    @patch(
        "payments.order_views.send_order_notification",
        side_effect=TelegramDeliveryError("Telegram unavailable."),
    )
    def test_failed_delivery_can_be_retried_with_the_same_order(self, send_notification):
        failed_response = self.client.post("/api/v1/orders/", self.payload, format="json")

        self.assertEqual(failed_response.status_code, 502)
        order = CourseOrder.objects.get()
        self.assertEqual(order.notification_status, CourseOrder.NotificationStatus.FAILED)

        send_notification.side_effect = None
        send_notification.return_value = "654321"
        retry_response = self.client.post("/api/v1/orders/", self.payload, format="json")

        self.assertEqual(retry_response.status_code, 200)
        self.assertEqual(
            retry_response.data["notification_status"],
            CourseOrder.NotificationStatus.ACCEPTED,
        )
        self.assertEqual(send_notification.call_count, 2)

    @patch(
        "payments.order_views.send_order_notification",
        side_effect=TelegramConfigurationError("Telegram is not configured."),
    )
    def test_missing_telegram_configuration_is_reported(self, send_notification):
        response = self.client.post("/api/v1/orders/", self.payload, format="json")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data["order_id"], str(CourseOrder.objects.get().id))
        send_notification.assert_called_once()

    def test_invalid_order_is_rejected_without_saving(self):
        self.payload["items"][0]["quantity"] = 0

        response = self.client.post("/api/v1/orders/", self.payload, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(CourseOrder.objects.count(), 0)

    def test_idempotency_key_cannot_be_reused_for_another_order(self):
        self.client.post("/api/v1/orders/", self.payload, format="json")
        changed_payload = {**self.payload, "customer_name": "Different Customer"}

        response = self.client.post("/api/v1/orders/", changed_payload, format="json")

        self.assertEqual(response.status_code, 409)
        self.assertEqual(CourseOrder.objects.count(), 1)
