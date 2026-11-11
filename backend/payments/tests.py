from unittest.mock import patch
from uuid import uuid4

from django.test import TestCase
from rest_framework.test import APIClient

from .models import WhatsAppOrder
from .whatsapp import WhatsAppConfigurationError, WhatsAppDeliveryError


class WhatsAppOrderApiTests(TestCase):
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

    @patch("payments.order_views.send_order_notification", return_value="wamid.test")
    def test_order_is_saved_and_sent_by_the_server(self, send_notification):
        response = self.client.post("/api/v1/orders/", self.payload, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["total"], "5000.00")
        self.assertEqual(response.data["notification_status"], WhatsAppOrder.NotificationStatus.ACCEPTED)
        self.assertEqual(WhatsAppOrder.objects.count(), 1)
        send_notification.assert_called_once()

    @patch("payments.order_views.send_order_notification", return_value="wamid.test")
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
    def test_delivery_failure_is_visible_and_saved_order_can_be_retried(self, send_notification):
        failed_response = self.client.post("/api/v1/orders/", self.payload, format="json")

        self.assertEqual(failed_response.status_code, 502)
        order = WhatsAppOrder.objects.get()
        self.assertEqual(order.notification_status, WhatsAppOrder.NotificationStatus.FAILED)

        send_notification.side_effect = None
        send_notification.return_value = "wamid.retry"
        retry_response = self.client.post("/api/v1/orders/", self.payload, format="json")

        self.assertEqual(retry_response.status_code, 200)
        self.assertEqual(
            retry_response.data["notification_status"],
            WhatsAppOrder.NotificationStatus.ACCEPTED,
        )
        self.assertEqual(send_notification.call_count, 2)

    @patch(
        "payments.order_views.send_order_notification",
        side_effect=WhatsAppConfigurationError("WhatsApp is not configured."),
    )
    def test_missing_whatsapp_configuration_is_not_reported_as_success(self, send_notification):
        response = self.client.post("/api/v1/orders/", self.payload, format="json")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data["order_id"], str(WhatsAppOrder.objects.get().id))
        send_notification.assert_called_once()

    @patch("payments.order_views.send_order_notification")
    def test_invalid_order_is_rejected_without_notification(self, send_notification):
        self.payload["items"][0]["quantity"] = 0

        response = self.client.post("/api/v1/orders/", self.payload, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(WhatsAppOrder.objects.count(), 0)
        send_notification.assert_not_called()

    @patch("payments.order_views.send_order_notification", return_value="wamid.test")
    def test_idempotency_key_cannot_be_reused_for_another_order(self, send_notification):
        self.client.post("/api/v1/orders/", self.payload, format="json")
        changed_payload = {**self.payload, "customer_name": "Different Customer"}

        response = self.client.post("/api/v1/orders/", changed_payload, format="json")

        self.assertEqual(response.status_code, 409)
        self.assertEqual(WhatsAppOrder.objects.count(), 1)
        send_notification.assert_called_once()
