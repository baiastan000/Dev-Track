import json
import logging
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings


logger = logging.getLogger(__name__)


class TelegramConfigurationError(Exception):
    pass


class TelegramDeliveryError(Exception):
    pass


def _configuration():
    bot_token = settings.TELEGRAM_BOT_TOKEN
    chat_id = settings.TELEGRAM_CHAT_ID
    if not bot_token or not chat_id:
        raise TelegramConfigurationError("Telegram bot settings are incomplete.")
    return bot_token, chat_id


def _order_text(order):
    items = "\n".join(
        f"- {item['title']} × {item['quantity']}"
        for item in order.items
    )
    return (
        f"New course order #{str(order.pk)[-8:]}\n"
        f"Name: {order.customer_name}\n"
        f"Email: {order.customer_email}\n"
        f"Courses:\n{items}\n"
        f"Total: {order.total:.2f} KGS"
    )


def send_order_notification(order):
    bot_token, chat_id = _configuration()
    request = Request(
        f"https://api.telegram.org/bot{bot_token}/sendMessage",
        data=json.dumps(
            {
                "chat_id": chat_id,
                "text": _order_text(order),
                "disable_web_page_preview": True,
            }
        ).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlopen(request, timeout=15) as response:
            result = json.loads(response.read())
    except HTTPError as error:
        error_code = "unknown"
        try:
            error_body = json.loads(error.read())
            error_code = str(error_body.get("error_code", "unknown"))
        except (json.JSONDecodeError, UnicodeDecodeError, AttributeError):
            pass
        logger.error(
            "Telegram API rejected order notification (HTTP %s, code %s).",
            error.code,
            error_code,
        )
        raise TelegramDeliveryError("Telegram rejected the order notification.") from error
    except (URLError, TimeoutError, OSError) as error:
        logger.error("Could not reach Telegram API: %s", type(error).__name__)
        raise TelegramDeliveryError("Could not reach the Telegram API.") from error
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        logger.error("Telegram API returned an invalid response.")
        raise TelegramDeliveryError("Telegram returned an invalid response.") from error

    if not isinstance(result, dict) or result.get("ok") is not True:
        error_code = result.get("error_code", "unknown") if isinstance(result, dict) else "unknown"
        logger.error("Telegram API did not accept the order notification (code %s).", error_code)
        raise TelegramDeliveryError("Telegram did not accept the order notification.")
    message = result.get("result")
    message_id = message.get("message_id") if isinstance(message, dict) else None
    if not isinstance(message_id, (int, str)) or not str(message_id):
        logger.error("Telegram API response did not contain a message ID.")
        raise TelegramDeliveryError("Telegram did not confirm the order notification.")
    return str(message_id)
