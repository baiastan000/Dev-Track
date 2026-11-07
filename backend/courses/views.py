from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import Course
from .serializers import CourseDetailSerializer, CourseListSerializer


class CourseListView(generics.ListAPIView):
    serializer_class = CourseListSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        queryset = Course.objects.filter(status=Course.Status.PUBLISHED).select_related(
            "category", "instructor"
        )
        category = self.request.query_params.get("category")
        search = self.request.query_params.get("search")
        if category:
            queryset = queryset.filter(category__slug=category)
        if search:
            queryset = queryset.filter(title__icontains=search)
        return queryset


class CourseDetailView(generics.RetrieveAPIView):
    queryset = (
        Course.objects.filter(status=Course.Status.PUBLISHED)
        .select_related("category", "instructor")
        .prefetch_related("modules__lessons")
    )
    serializer_class = CourseDetailSerializer
    permission_classes = (AllowAny,)
    lookup_field = "slug"
