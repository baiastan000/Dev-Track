import json
import logging
import re
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from django.conf import settings


logger = logging.getLogger(__name__)


class WhatsAppConfigurationError(Exception):
    pass


class WhatsAppDeliveryError(Exception):
    pass


def _configuration():
    access_token = settings.WHATSAPP_ACCESS_TOKEN
    sender_phone = settings.WHATSAPP_SENDER_PHONE
    phone_number_id = settings.WHATSAPP_PHONE_NUMBER_ID
    recipient_phone = settings.WHATSAPP_RECIPIENT_PHONE
    template_name = settings.WHATSAPP_ORDER_TEMPLATE_NAME
    template_language = settings.WHATSAPP_TEMPLATE_LANGUAGE
    api_version = settings.WHATSAPP_API_VERSION

    if not all(
        (
            access_token,
            sender_phone,
            phone_number_id,
            recipient_phone,
            template_name,
            template_language,
            api_version,
        )
    ):
        raise WhatsAppConfigurationError("WhatsApp Cloud API settings are incomplete.")
    if not re.fullmatch(r"\d{8,15}", recipient_phone) or not re.fullmatch(
        r"\d{8,15}", sender_phone
    ):
        raise WhatsAppConfigurationError(
            "WhatsApp sender and recipient must be international numbers without '+'."
        )
    if sender_phone == recipient_phone:
        raise WhatsAppConfigurationError(
            "The WhatsApp Cloud API sender and order recipient must be different numbers."
        )
    if not re.fullmatch(r"v\d+\.\d+", api_version):
        raise WhatsAppConfigurationError("WhatsApp API version must use the format vNN.N.")

    return (
        access_token,
        phone_number_id,
        recipient_phone,
        template_name,
        template_language,
        api_version,
    )


def _template_values(order):
    item_summary = "; ".join(
        f"{item['title'][:60]} × {item['quantity']}" for item in order.items
    )
    if len(item_summary) > 900:
        item_summary = f"{item_summary[:897]}..."
    return [
        str(order.pk)[-8:],
        order.customer_name,
        order.customer_email,
        item_summary,
        f"{order.total:.2f}",
    ]


def send_order_notification(order):
    access_token, phone_number_id, recipient_phone, template_name, template_language, api_version = (
        _configuration()
    )
    payload = {
        "messaging_product": "whatsapp",
        "to": recipient_phone,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": template_language},
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": value}
                        for value in _template_values(order)
                    ],
                }
            ],
        },
    }
    request = Request(
        f"https://graph.facebook.com/{api_version}/{quote(phone_number_id, safe='')}/messages",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=15) as response:
            result = json.loads(response.read())
    except HTTPError as error:
        error_code = "unknown"
        try:
            error_body = json.loads(error.read())
            error_code = str(error_body.get("error", {}).get("code", "unknown"))
        except (json.JSONDecodeError, UnicodeDecodeError, AttributeError):
            pass
        logger.error(
            "WhatsApp API rejected order notification (HTTP %s, code %s).",
            error.code,
            error_code,
        )
        raise WhatsAppDeliveryError("WhatsApp rejected the order notification.") from error
    except (URLError, TimeoutError, OSError) as error:
        logger.error("Could not reach WhatsApp API: %s", type(error).__name__)
        raise WhatsAppDeliveryError("Could not reach the WhatsApp API.") from error
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        logger.error("WhatsApp API returned an invalid response.")
        raise WhatsAppDeliveryError("WhatsApp returned an invalid response.") from error

    if not isinstance(result, dict):
        logger.error("WhatsApp API returned an unexpected response.")
        raise WhatsAppDeliveryError("WhatsApp returned an invalid response.")
    messages = result.get("messages")
    if not isinstance(messages, list) or not messages or not isinstance(messages[0], dict):
        logger.error("WhatsApp API accepted no message for order notification.")
        raise WhatsAppDeliveryError("WhatsApp did not confirm the order notification.")
    message_id = messages[0].get("id")
    if not isinstance(message_id, str) or not message_id:
        logger.error("WhatsApp API response did not contain a message ID.")
        raise WhatsAppDeliveryError("WhatsApp did not confirm the order notification.")
    return message_id
