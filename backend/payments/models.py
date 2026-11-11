import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models

from courses.models import Course, Enrollment


class Payment(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SUCCEEDED = "succeeded", "Succeeded"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"

    class Provider(models.TextChoices):
        STRIPE = "stripe", "Stripe"
        OTHER = "other", "Other"

    idempotency_key = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="payments"
    )
    course = models.ForeignKey(Course, on_delete=models.PROTECT, related_name="payments")
    enrollment = models.OneToOneField(
        Enrollment,
        on_delete=models.PROTECT,
        related_name="payment",
        null=True,
        blank=True,
    )
    provider = models.CharField(max_length=20, choices=Provider.choices)
    provider_reference = models.CharField(max_length=200, unique=True, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [models.Index(fields=("student", "status", "created_at"))]

    def clean(self):
        super().clean()
        errors = {}
        if self.student_id and self.student.role != "student":
            errors["student"] = "Only students can make course payments."
        if self.enrollment_id and (
            self.enrollment.student_id != self.student_id
            or self.enrollment.course_id != self.course_id
        ):
            errors["enrollment"] = "Payment enrollment must match its student and course."
        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student} — {self.amount} {self.currency} ({self.status})"


class WhatsAppOrder(models.Model):
    class NotificationStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted by WhatsApp"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idempotency_key = models.UUIDField(unique=True)
    customer_name = models.CharField(max_length=80)
    customer_email = models.EmailField(max_length=254)
    items = models.JSONField()
    total = models.DecimalField(max_digits=10, decimal_places=2)
    notification_status = models.CharField(
        max_length=10,
        choices=NotificationStatus.choices,
        default=NotificationStatus.PENDING,
    )
    whatsapp_message_id = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"Order {self.pk} — {self.customer_name} ({self.notification_status})"
