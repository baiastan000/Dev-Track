from django.urls import path

from .order_views import WhatsAppOrderCreateView


urlpatterns = [
    path("orders/", WhatsAppOrderCreateView.as_view(), name="whatsapp-order-create"),
]
