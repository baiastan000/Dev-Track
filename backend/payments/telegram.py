import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings


class TelegramNotificationError(Exception):
    pass


def send_order_notification(order):
    token = settings.TELEGRAM_BOT_TOKEN
    chat_id = settings.TELEGRAM_CHAT_ID
    if not token or not chat_id:
        raise TelegramNotificationError("Telegram bot token and chat ID must be configured.")

    courses = "\n".join(
        f"- {item['title']} x {item['quantity']} — {item['unit_price']} KGS"
        for item in order.items
    )
    message = "\n".join(
        (
            "Новый заказ курса",
            f"Заказ: {order.id}",
            "Курсы:",
            courses,
            f"Итого: {order.total} KGS",
        )
    )
    request = Request(
        f"https://api.telegram.org/bot{token}/sendMessage",
        data=json.dumps({"chat_id": chat_id, "text": message}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=5) as response:
            result = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        raise TelegramNotificationError(
            f"Telegram returned HTTP {error.code}."
        ) from None
    except (URLError, TimeoutError):
        raise TelegramNotificationError("Telegram could not be reached.") from None
    except json.JSONDecodeError:
        raise TelegramNotificationError("Telegram returned an invalid response.") from None

    if not isinstance(result, dict) or result.get("ok") is not True:
        raise TelegramNotificationError("Telegram rejected the order notification.")
