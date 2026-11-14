import json
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import patch
from uuid import uuid4

from django.test import SimpleTestCase, TestCase, override_settings
from rest_framework.test import APIClient

from .models import CourseOrder
from .whatsapp import (
    WhatsAppConfigurationError,
    WhatsAppDeliveryError,
    send_order_notification,
)


class WhatsAppClientTests(SimpleTestCase):
    @override_settings(
        WHATSAPP_ACCESS_TOKEN="test-access-token",
        WHATSAPP_PHONE_NUMBER_ID="123456",
        WHATSAPP_RECIPIENT_PHONE="+996501306654",
        WHATSAPP_TEMPLATE_NAME="course_order_notification",
        WHATSAPP_TEMPLATE_LANGUAGE="en_US",
        WHATSAPP_GRAPH_API_VERSION="v26.0",
    )
    @patch("payments.whatsapp.urlopen")
    def test_sends_order_details_using_the_approved_template(self, urlopen_mock):
        response = SimpleNamespace(
            read=lambda: b'{"messaging_product":"whatsapp","messages":[{"id":"wamid.456"}]}'
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
        self.assertEqual(
            request.full_url,
            "https://graph.facebook.com/v26.0/123456/messages",
        )
        self.assertEqual(request.get_header("Authorization"), "Bearer test-access-token")
        payload = json.loads(request.data)
        self.assertEqual(payload["to"], "996501306654")
        self.assertEqual(payload["template"]["name"], "course_order_notification")
        parameters = payload["template"]["components"][0]["parameters"]
        values = [parameter["text"] for parameter in parameters]
        self.assertIn("Aida Example", values)
        self.assertIn("aida@example.com", values)
        self.assertIn("JavaScript x 2", values)
        self.assertIn("5000.00 KGS", values)
        self.assertEqual(message_id, "wamid.456")

    @override_settings(
        WHATSAPP_ACCESS_TOKEN="",
        WHATSAPP_PHONE_NUMBER_ID="",
        WHATSAPP_RECIPIENT_PHONE="",
        WHATSAPP_TEMPLATE_NAME="",
        WHATSAPP_TEMPLATE_LANGUAGE="",
        WHATSAPP_GRAPH_API_VERSION="v26.0",
    )
    def test_missing_credentials_raise_configuration_error(self):
        with self.assertRaises(WhatsAppConfigurationError):
            send_order_notification(SimpleNamespace())

    @override_settings(
        WHATSAPP_ACCESS_TOKEN="test-access-token",
        WHATSAPP_PHONE_NUMBER_ID="123456",
        WHATSAPP_RECIPIENT_PHONE="+996501306654",
        WHATSAPP_TEMPLATE_NAME="course_order_notification",
        WHATSAPP_TEMPLATE_LANGUAGE="en_US",
        WHATSAPP_GRAPH_API_VERSION="v26.0",
    )
    @patch("payments.whatsapp.urlopen")
    def test_whatsapp_api_rejection_is_reported_as_delivery_failure(self, urlopen_mock):
        response = SimpleNamespace(
            read=lambda: b'{"error":{"code":132001,"message":"Template not found"}}'
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

        with self.assertLogs("payments.whatsapp", level="ERROR"):
            with self.assertRaises(WhatsAppDeliveryError):
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
        side_effect=WhatsAppDeliveryError("WhatsApp unavailable."),
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
        side_effect=WhatsAppConfigurationError("WhatsApp is not configured."),
    )
    def test_missing_whatsapp_configuration_is_reported(self, send_notification):
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
