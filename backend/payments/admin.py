from django.contrib import admin

from .models import CourseOrder, Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "student", "course", "amount", "currency", "provider", "status", "created_at")
    list_filter = ("status", "provider", "currency")
    search_fields = ("student__email", "course__title", "provider_reference")
    readonly_fields = ("idempotency_key", "created_at", "updated_at")


@admin.register(CourseOrder)
class CourseOrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "customer_name",
        "customer_email",
        "total",
        "notification_status",
        "created_at",
    )
    list_filter = ("notification_status", "created_at")
    search_fields = ("customer_name", "customer_email", "=id", "telegram_message_id")
    readonly_fields = (
        "id",
        "idempotency_key",
        "customer_name",
        "customer_email",
        "items",
        "total",
        "notification_status",
        "telegram_message_id",
        "created_at",
    )
