from django.db.models import Count, Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from courses.models import Course, Enrollment
from users.serializers import PublicUserSerializer


class DashboardView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        user = request.user
        if user.role == user.Role.INSTRUCTOR:
            courses = Course.objects.filter(instructor=user).annotate(
                student_count=Count(
                    "enrollments",
                    filter=Q(enrollments__status__in=("active", "completed")),
                    distinct=True,
                )
            )
            return Response(
                {
                    "user": PublicUserSerializer(user).data,
                    "role": user.role,
                    "courses": [
                        {
                            "id": course.id,
                            "title": course.title,
                            "status": course.status,
                            "student_count": course.student_count,
                        }
                        for course in courses
                    ],
                }
            )

        if user.role == user.Role.ADMIN:
            return Response(
                {
                    "user": PublicUserSerializer(user).data,
                    "role": user.role,
                    "counts": {
                        "students": user.__class__.objects.filter(role="student").count(),
                        "instructors": user.__class__.objects.filter(role="instructor").count(),
                        "courses": Course.objects.count(),
                        "enrollments": Enrollment.objects.count(),
                    },
                }
            )

        enrollments = (
            Enrollment.objects.filter(student=user)
            .exclude(status__in=(Enrollment.Status.CANCELLED, Enrollment.Status.REFUNDED))
            .select_related("course", "course__category")
            .annotate(
                total_lessons=Count(
                    "course__modules__lessons", distinct=True
                ),
                completed_lessons=Count(
                    "lesson_progress",
                    filter=Q(lesson_progress__completed_at__isnull=False),
                    distinct=True,
                ),
            )
        )
        return Response(
            {
                "user": PublicUserSerializer(user).data,
                "role": user.role,
                "enrollments": [
                    {
                        "id": enrollment.id,
                        "course": {
                            "id": enrollment.course_id,
                            "title": enrollment.course.title,
                            "slug": enrollment.course.slug,
                            "category": enrollment.course.category.name,
                        },
                        "status": enrollment.status,
                        "enrolled_at": enrollment.enrolled_at,
                        "total_lessons": enrollment.total_lessons,
                        "completed_lessons": enrollment.completed_lessons,
                    }
                    for enrollment in enrollments
                ],
            }
        )
