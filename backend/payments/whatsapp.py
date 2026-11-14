import json
import logging
import re
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings


logger = logging.getLogger(__name__)


class WhatsAppConfigurationError(Exception):
    pass


class WhatsAppDeliveryError(Exception):
    pass


def _configuration():
    access_token = settings.WHATSAPP_ACCESS_TOKEN.strip()
    phone_number_id = settings.WHATSAPP_PHONE_NUMBER_ID.strip()
    recipient_phone = re.sub(r"\D", "", settings.WHATSAPP_RECIPIENT_PHONE.strip())
    template_name = settings.WHATSAPP_TEMPLATE_NAME.strip()
    language = settings.WHATSAPP_TEMPLATE_LANGUAGE.strip()
    api_version = settings.WHATSAPP_GRAPH_API_VERSION.strip()
    if not all((access_token, phone_number_id, recipient_phone, template_name, language)):
        raise WhatsAppConfigurationError("WhatsApp Business API settings are incomplete.")
    if not re.fullmatch(r"[1-9]\d{7,14}", recipient_phone):
        raise WhatsAppConfigurationError("WhatsApp recipient must be an international phone number.")
    if not phone_number_id.isdigit():
        raise WhatsAppConfigurationError("WhatsApp phone number ID must contain only digits.")
    if not re.fullmatch(r"v\d+\.\d+", api_version):
        raise WhatsAppConfigurationError("WhatsApp Graph API version is invalid.")
    return access_token, phone_number_id, recipient_phone, template_name, language, api_version


def _template_parameters(order):
    courses = "; ".join(
        f"{item['title']} x {item['quantity']}"
        for item in order.items
    )
    return [
        str(order.pk)[-8:],
        order.customer_name,
        order.customer_email,
        courses[:1024],
        f"{order.total:.2f} KGS",
    ]


def _error_details(payload):
    if not isinstance(payload, dict):
        return "unknown", "unknown"
    error = payload.get("error")
    if not isinstance(error, dict):
        return "unknown", "unknown"
    code = str(error.get("code", "unknown"))
    message = error.get("message", "unknown")
    if not isinstance(message, str):
        message = "unknown"
    return code, " ".join(message.split())[:300] or "unknown"


def send_order_notification(order):
    (
        access_token,
        phone_number_id,
        recipient_phone,
        template_name,
        language,
        api_version,
    ) = _configuration()
    request = Request(
        f"https://graph.facebook.com/{api_version}/{phone_number_id}/messages",
        data=json.dumps(
            {
                "messaging_product": "whatsapp",
                "to": recipient_phone,
                "type": "template",
                "template": {
                    "name": template_name,
                    "language": {"code": language},
                    "components": [
                        {
                            "type": "body",
                            "parameters": [
                                {"type": "text", "text": value}
                                for value in _template_parameters(order)
                            ],
                        }
                    ],
                },
            }
        ).encode("utf-8"),
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
        try:
            error_body = json.loads(error.read())
        except (json.JSONDecodeError, UnicodeDecodeError):
            error_body = None
        error_code, description = _error_details(error_body)
        logger.error(
            "WhatsApp API rejected order notification (HTTP %s, code %s, message: %s).",
            error.code,
            error_code,
            description,
        )
        raise WhatsAppDeliveryError("WhatsApp rejected the order notification.") from error
    except (URLError, TimeoutError, OSError) as error:
        logger.error("Could not reach WhatsApp API: %s", type(error).__name__)
        raise WhatsAppDeliveryError("Could not reach the WhatsApp API.") from error
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        logger.error("WhatsApp API returned an invalid response.")
        raise WhatsAppDeliveryError("WhatsApp returned an invalid response.") from error

    messages = result.get("messages") if isinstance(result, dict) else None
    message = messages[0] if isinstance(messages, list) and messages else None
    message_id = message.get("id") if isinstance(message, dict) else None
    if not isinstance(message_id, str) or not message_id:
        error_code, description = _error_details(result)
        logger.error(
            "WhatsApp API did not accept the order notification (code %s, message: %s).",
            error_code,
            description,
        )
        raise WhatsAppDeliveryError("WhatsApp did not confirm the order notification.")
    return message_id
