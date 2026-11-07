from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "student", "course", "amount", "currency", "provider", "status", "created_at")
    list_filter = ("status", "provider", "currency")
    search_fields = ("student__email", "course__title", "provider_reference")
    readonly_fields = ("idempotency_key", "created_at", "updated_at")
