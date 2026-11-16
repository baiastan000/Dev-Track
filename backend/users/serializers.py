import uuid

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers


User = get_user_model()


class PublicUserSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "email", "display_name", "role")

    def get_display_name(self, user):
        return user.get_full_name() or user.username or user.email


class RegistrationSerializer(serializers.ModelSerializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    username = serializers.CharField(required=False)
    display_name = serializers.CharField(write_only=True, required=False, allow_blank=False)

    class Meta:
        model = User
        fields = ("email", "username", "password", "display_name")

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return normalized

    def create(self, validated_data):
        display_name = validated_data.pop("display_name", "").strip()
        username = validated_data.pop("username", f"user-{uuid.uuid4().hex}")
        return User.objects.create_user(
            email=validated_data["email"],
            username=username,
            password=validated_data["password"],
            first_name=display_name,
        )
