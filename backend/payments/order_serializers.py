from decimal import Decimal

from rest_framework import serializers


class OrderItemSerializer(serializers.Serializer):
    course_id = serializers.CharField(max_length=100)
    title = serializers.CharField(max_length=120, trim_whitespace=True)
    quantity = serializers.IntegerField(min_value=1, max_value=10)
    unit_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0"),
    )


class CourseOrderSerializer(serializers.Serializer):
    idempotency_key = serializers.UUIDField()
    customer_name = serializers.CharField(max_length=80, trim_whitespace=True)
    customer_email = serializers.EmailField(max_length=254)
    items = OrderItemSerializer(many=True, allow_empty=False, max_length=10)

    def validate_customer_name(self, value):
        if not value:
            raise serializers.ValidationError("Enter a name.")
        return value

    def validate(self, attrs):
        attrs["total"] = sum(
            (item["unit_price"] * item["quantity"] for item in attrs["items"]),
            Decimal("0"),
        )
        if attrs["total"] > Decimal("99999999.99"):
            raise serializers.ValidationError({"items": "The order total is too large."})
        return attrs
