from django.urls import path

from .order_views import CourseOrderCreateView


urlpatterns = [
    path("orders/", CourseOrderCreateView.as_view(), name="course-order-create"),
]
