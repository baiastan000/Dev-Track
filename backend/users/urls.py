from django.contrib.auth import views as auth_views
from django.urls import path, reverse_lazy

from . import views


urlpatterns = [
    path("csrf/", views.csrf_token, name="csrf-token"),
    path("session/", views.current_session, name="session"),
    path("register/", views.register, name="register"),
    path("login/", views.sign_in, name="login"),
    path("logout/", views.sign_out, name="logout"),
    path("password-reset/", views.request_password_reset, name="password-reset"),
    path("password-reset/verify/", views.verify_password_reset_code, name="password-reset-verify"),
    path("password-reset/confirm/", views.confirm_password_reset, name="password-reset-confirm-code"),
    path("profile/", views.update_profile, name="profile"),
    path("change-password/", views.change_password, name="change-password"),
    path(
        "password-reset/confirm/<uidb64>/<token>/",
        auth_views.PasswordResetConfirmView.as_view(
            template_name="registration/password_reset_confirm.html",
            success_url=reverse_lazy("password-reset-complete"),
        ),
        name="password-reset-confirm",
    ),
    path(
        "password-reset/complete/",
        auth_views.PasswordResetCompleteView.as_view(
            template_name="registration/password_reset_complete.html"
        ),
        name="password-reset-complete",
    ),
]
