import logging

from django.contrib import admin
from django.contrib import messages

from .models import CourseOrder, Payment
from .telegram import TelegramNotificationError, send_order_notification


logger = logging.getLogger(__name__)


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "student", "course", "amount", "currency", "provider", "status", "created_at")
    list_filter = ("status", "provider", "currency")
    search_fields = ("student__email", "course__title", "provider_reference")
    readonly_fields = ("idempotency_key", "created_at", "updated_at")


@admin.register(CourseOrder)
class CourseOrderAdmin(admin.ModelAdmin):
    actions = ("retry_telegram_notifications",)
    list_display = (
        "id",
        "customer_name",
        "customer_email",
        "total",
        "notification_status",
        "created_at",
    )
    list_filter = ("notification_status", "created_at")
    search_fields = ("customer_name", "customer_email", "=id")
    readonly_fields = (
        "id",
        "idempotency_key",
        "customer_name",
        "customer_email",
        "items",
        "total",
        "notification_status",
        "created_at",
    )

    @admin.action(description="Retry failed Telegram notifications")
    def retry_telegram_notifications(self, request, queryset):
        sent = 0
        failed = 0
        retryable_orders = queryset.exclude(
            notification_status=CourseOrder.NotificationStatus.ACCEPTED
        )
        for order in retryable_orders:
            try:
                send_order_notification(order)
            except TelegramNotificationError as error:
                order.notification_status = CourseOrder.NotificationStatus.FAILED
                order.save(update_fields=("notification_status",))
                logger.error("Telegram notification failed for order %s: %s", order.pk, error)
                failed += 1
            else:
                order.notification_status = CourseOrder.NotificationStatus.ACCEPTED
                order.save(update_fields=("notification_status",))
                sent += 1

        if sent:
            self.message_user(
                request,
                f"Telegram notification sent for {sent} order(s).",
                messages.SUCCESS,
            )
        if failed:
            self.message_user(
                request,
                f"Telegram notification failed for {failed} order(s).",
                messages.ERROR,
            )
