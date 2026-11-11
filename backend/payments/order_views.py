from django.db import transaction
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import CourseOrder
from .order_serializers import CourseOrderSerializer
from .telegram import (
    TelegramConfigurationError,
    TelegramDeliveryError,
    send_order_notification,
)


def _order_response(order):
    return {
        "id": str(order.id),
        "customer": {
            "name": order.customer_name,
            "email": order.customer_email,
        },
        "items": order.items,
        "total": str(order.total),
        "created_at": order.created_at.isoformat(),
        "notification_status": order.notification_status,
    }


class CourseOrderCreateView(APIView):
    authentication_classes = ()
    permission_classes = (AllowAny,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = "public_orders"

    def post(self, request):
        serializer = CourseOrderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        values = serializer.validated_data
        defaults = {
            "customer_name": values["customer_name"],
            "customer_email": values["customer_email"],
            "items": [
                {
                    **item,
                    "unit_price": str(item["unit_price"]),
                }
                for item in values["items"]
            ],
            "total": values["total"],
        }

        with transaction.atomic():
            order, _ = CourseOrder.objects.get_or_create(
                idempotency_key=values["idempotency_key"],
                defaults=defaults,
            )
            order = CourseOrder.objects.select_for_update().get(pk=order.pk)
            if any(
                getattr(order, field) != defaults[field]
                for field in ("customer_name", "customer_email", "items", "total")
            ):
                return Response(
                    {"detail": "This order key was already used for a different order."},
                    status=status.HTTP_409_CONFLICT,
                )

            if order.notification_status == CourseOrder.NotificationStatus.ACCEPTED:
                return Response(_order_response(order), status=status.HTTP_200_OK)

            try:
                message_id = send_order_notification(order)
            except TelegramConfigurationError:
                return Response(
                    {
                        "detail": "The order was saved, but Telegram notifications are not configured.",
                        "order_id": str(order.id),
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
            except TelegramDeliveryError:
                order.notification_status = CourseOrder.NotificationStatus.FAILED
                order.save(update_fields=("notification_status",))
                return Response(
                    {
                        "detail": "The order was saved, but Telegram could not confirm delivery. Retry the same order.",
                        "order_id": str(order.id),
                    },
                    status=status.HTTP_502_BAD_GATEWAY,
                )

            order.notification_status = CourseOrder.NotificationStatus.ACCEPTED
            order.telegram_message_id = message_id
            order.save(update_fields=("notification_status", "telegram_message_id"))
            return Response(_order_response(order), status=status.HTTP_201_CREATED)
