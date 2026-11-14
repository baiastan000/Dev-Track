from uuid import uuid4

from django.test import TestCase
from rest_framework.test import APIClient

from .models import CourseOrder


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

    def test_order_is_saved_by_the_server(self):
        response = self.client.post("/api/v1/orders/", self.payload, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["total"], "5000.00")
        self.assertEqual(response.data["customer"]["name"], "Aida Example")
        self.assertEqual(CourseOrder.objects.count(), 1)
        self.assertEqual(
            CourseOrder.objects.get().notification_status,
            CourseOrder.NotificationStatus.ACCEPTED,
        )

    def test_retry_returns_the_existing_order(self):
        first_response = self.client.post("/api/v1/orders/", self.payload, format="json")
        retry_response = self.client.post("/api/v1/orders/", self.payload, format="json")

        self.assertEqual(first_response.status_code, 201)
        self.assertEqual(retry_response.status_code, 200)
        self.assertEqual(retry_response.data["id"], first_response.data["id"])

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
