import json
import hashlib
import hmac
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import (
    authenticate,
    get_user_model,
    login,
    logout,
    update_session_auth_hash,
)
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.db import transaction
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils import timezone
from django.utils.crypto import salted_hmac
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.serializers import as_serializer_error

from .models import PasswordResetChallenge
from .serializers import PublicUserSerializer, RegistrationSerializer


User = get_user_model()
RESET_CODE_TTL = timedelta(minutes=10)
RESET_TOKEN_TTL = timedelta(minutes=10)
RESET_CODE_MAX_ATTEMPTS = 5
RESET_EMAIL_COOLDOWN = timedelta(minutes=1)
RESET_EMAIL_WINDOW = timedelta(hours=1)
RESET_EMAIL_MAX_PER_WINDOW = 3
RESET_GENERIC_RESPONSE = {
    "detail": "If an account exists for that email, a verification code will be sent."
}


def _read_json(request):
    try:
        payload = json.loads(request.body or b"{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise ValidationError({"detail": "Request body must be valid JSON."})
    if not isinstance(payload, dict):
        raise ValidationError({"detail": "Request body must be a JSON object."})
    return payload


def _validation_response(error):
    return JsonResponse(as_serializer_error(error), status=status.HTTP_400_BAD_REQUEST)


@require_GET
@ensure_csrf_cookie
def csrf_token(request):
    return JsonResponse({"csrfToken": get_token(request)})


@require_GET
@ensure_csrf_cookie
def current_session(request):
    user = request.user if request.user.is_authenticated else None
    return JsonResponse({"user": PublicUserSerializer(user).data if user else None})


@require_POST
@csrf_protect
def register(request):
    try:
        serializer = RegistrationSerializer(data=_read_json(request))
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        login(request, user, backend="django.contrib.auth.backends.ModelBackend")
        return JsonResponse({"user": PublicUserSerializer(user).data}, status=201)
    except ValidationError as error:
        return _validation_response(error)


@require_POST
@csrf_protect
def sign_in(request):
    try:
        payload = _read_json(request)
    except ValidationError as error:
        return _validation_response(error)

    email = payload.get("email")
    password = payload.get("password")
    if not isinstance(email, str) or not isinstance(password, str):
        return JsonResponse(
            {"detail": "Email and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(request, username=email.strip().lower(), password=password)
    if user is None:
        return JsonResponse(
            {"detail": "Email or password is incorrect."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    login(request, user)
    return JsonResponse({"user": PublicUserSerializer(user).data})


@require_POST
@csrf_protect
def sign_out(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Authentication required."}, status=401)
    logout(request)
    return JsonResponse({"detail": "Signed out."})


@require_POST
@csrf_protect
def request_password_reset(request):
    try:
        payload = _read_json(request)
    except ValidationError as error:
        return _validation_response(error)
    email = payload.get("email")
    if not isinstance(email, str) or not email.strip():
        return JsonResponse({"email": ["A valid email is required."]}, status=400)
    email = email.strip().lower()
    user = User.objects.filter(
        email__iexact=email,
        is_active=True,
    ).first()
    if user is None:
        return JsonResponse(RESET_GENERIC_RESPONSE)

    now = timezone.now()
    with transaction.atomic():
        challenge = (
            PasswordResetChallenge.objects.select_for_update()
            .filter(user=user)
            .first()
        )
        if challenge is None:
            challenge = PasswordResetChallenge(user=user)

        window_started_at = challenge.window_started_at
        if window_started_at is not None and window_started_at > now - RESET_EMAIL_WINDOW:
            if (
                challenge.sent_count >= RESET_EMAIL_MAX_PER_WINDOW
                or (
                    challenge.sent_at is not None
                    and challenge.sent_at > now - RESET_EMAIL_COOLDOWN
                )
            ):
                return JsonResponse(RESET_GENERIC_RESPONSE)
            sent_count = challenge.sent_count + 1
        else:
            window_started_at = now
            sent_count = 1

        code = f"{secrets.randbelow(1_000_000):06d}"
        challenge.code_hash = salted_hmac(
            "users.password_reset_code",
            f"{user.pk}:{code}",
            secret=settings.SECRET_KEY,
            algorithm="sha256",
        ).hexdigest()
        challenge.reset_token_hash = ""
        challenge.expires_at = now + RESET_CODE_TTL
        challenge.sent_at = now
        challenge.window_started_at = window_started_at
        challenge.sent_count = sent_count
        challenge.failed_attempts = 0
        challenge.save()

        sent = send_mail(
            "Your DevTrack password reset code",
            (
                f"Your password reset code is {code}.\n\n"
                "The code expires in 10 minutes. If you did not request this, "
                "you can ignore this email."
            ),
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        if sent != 1:
            raise RuntimeError("The password reset email could not be sent.")

    return JsonResponse(RESET_GENERIC_RESPONSE)


@require_POST
@csrf_protect
def verify_password_reset_code(request):
    try:
        payload = _read_json(request)
    except ValidationError as error:
        return _validation_response(error)

    email = payload.get("email")
    code = payload.get("code")
    if not isinstance(email, str) or not isinstance(code, str):
        return JsonResponse({"detail": "Email and verification code are required."}, status=400)

    email = email.strip().lower()
    user = User.objects.filter(
        email__iexact=email,
        is_active=True,
    ).first()
    now = timezone.now()
    if user is None:
        return JsonResponse({"detail": "The verification code is invalid or expired."}, status=400)

    with transaction.atomic():
        challenge = (
            PasswordResetChallenge.objects.select_for_update()
            .filter(user=user)
            .first()
        )
        if (
            challenge is None
            or not challenge.code_hash
            or challenge.expires_at is None
            or challenge.expires_at <= now
            or challenge.failed_attempts >= RESET_CODE_MAX_ATTEMPTS
        ):
            return JsonResponse({"detail": "The verification code is invalid or expired."}, status=400)

        expected_hash = salted_hmac(
            "users.password_reset_code",
            f"{user.pk}:{code}",
            secret=settings.SECRET_KEY,
            algorithm="sha256",
        ).hexdigest()
        if not hmac.compare_digest(challenge.code_hash, expected_hash):
            challenge.failed_attempts += 1
            challenge.save(update_fields=["failed_attempts"])
            return JsonResponse({"detail": "The verification code is invalid or expired."}, status=400)

        reset_token = secrets.token_urlsafe(32)
        challenge.code_hash = ""
        challenge.reset_token_hash = hashlib.sha256(reset_token.encode("utf-8")).hexdigest()
        challenge.expires_at = now + RESET_TOKEN_TTL
        challenge.failed_attempts = 0
        challenge.save(update_fields=["code_hash", "reset_token_hash", "expires_at", "failed_attempts"])

    return JsonResponse({"resetToken": reset_token})


@require_POST
@csrf_protect
def confirm_password_reset(request):
    try:
        payload = _read_json(request)
    except ValidationError as error:
        return _validation_response(error)

    reset_token = payload.get("resetToken")
    password = payload.get("password")
    if not isinstance(reset_token, str) or not isinstance(password, str):
        return JsonResponse({"detail": "A reset token and new password are required."}, status=400)

    token_hash = hashlib.sha256(reset_token.encode("utf-8")).hexdigest()
    now = timezone.now()
    with transaction.atomic():
        challenge = (
            PasswordResetChallenge.objects.select_for_update()
            .select_related("user")
            .filter(reset_token_hash=token_hash, expires_at__gt=now)
            .first()
        )
        if challenge is None:
            return JsonResponse({"detail": "The reset session is invalid or expired."}, status=400)

        try:
            validate_password(password, challenge.user)
        except DjangoValidationError as error:
            return JsonResponse({"password": error.messages}, status=400)

        challenge.user.set_password(password)
        challenge.user.save(update_fields=["password"])
        challenge.delete()

    return JsonResponse({"detail": "Password updated. You can now sign in."})


@require_POST
@csrf_protect
def update_profile(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Authentication required."}, status=401)
    try:
        payload = _read_json(request)
    except ValidationError as error:
        return _validation_response(error)

    display_name = payload.get("display_name")
    email = payload.get("email")
    if not isinstance(display_name, str) or not display_name.strip():
        return JsonResponse({"display_name": ["Enter a name."]}, status=400)
    if not isinstance(email, str) or not email.strip():
        return JsonResponse({"email": ["Enter an email address."]}, status=400)
    normalized_email = email.strip().lower()
    try:
        validate_email(normalized_email)
    except DjangoValidationError:
        return JsonResponse({"email": ["Enter a valid email address."]}, status=400)
    if (
        User.objects.filter(email__iexact=normalized_email)
        .exclude(pk=request.user.pk)
        .exists()
    ):
        return JsonResponse({"email": ["This email address is already registered."]}, status=400)

    request.user.first_name = display_name.strip()
    request.user.email = normalized_email
    request.user.save(update_fields=["first_name", "email"])
    return JsonResponse({"user": PublicUserSerializer(request.user).data})


@require_POST
@csrf_protect
def change_password(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Authentication required."}, status=401)
    try:
        payload = _read_json(request)
    except ValidationError as error:
        return _validation_response(error)

    current_password = payload.get("current_password")
    new_password = payload.get("new_password")
    if not isinstance(current_password, str) or not isinstance(new_password, str):
        return JsonResponse({"detail": "Current and new passwords are required."}, status=400)
    if not request.user.check_password(current_password):
        return JsonResponse({"current_password": ["The current password is incorrect."]}, status=400)
    try:
        validate_password(new_password, request.user)
    except DjangoValidationError as error:
        return JsonResponse({"new_password": error.messages}, status=400)

    request.user.set_password(new_password)
    request.user.save(update_fields=["password"])
    update_session_auth_hash(request, request.user)
    return JsonResponse({"detail": "Password updated."})
