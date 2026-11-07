import json

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import PasswordResetForm
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.serializers import as_serializer_error

from .serializers import PublicUserSerializer, RegistrationSerializer


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
    if not isinstance(email, str):
        return JsonResponse({"email": ["A valid email is required."]}, status=400)

    form = PasswordResetForm({"email": email.strip()})
    if not form.is_valid():
        return _validation_response(ValidationError(form.errors.get_json_data()))

    form.save(
        request=request,
        use_https=request.is_secure(),
        email_template_name="registration/password_reset_email.html",
        subject_template_name="registration/password_reset_subject.txt",
    )
    return JsonResponse(
        {"detail": "If an account exists for that email, reset instructions will be sent."}
    )
