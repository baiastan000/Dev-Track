from rest_framework import serializers

from .models import Category, Course, Lesson, Module


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug")


class LessonSerializer(serializers.ModelSerializer):
    content = serializers.SerializerMethodField()
    video_url = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ("id", "title", "content", "content_type", "video_url", "position", "is_preview")

    def _can_access(self, lesson):
        if lesson.is_preview:
            return True
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        if user.role == "admin":
            return True
        course_id = lesson.module.course_id
        access_by_course = self.context.setdefault("_course_access", {})
        if course_id not in access_by_course:
            if user.role == "instructor":
                access_by_course[course_id] = Course.objects.filter(
                    pk=course_id, instructor=user
                ).exists()
            elif user.role == "student":
                access_by_course[course_id] = Course.objects.filter(
                    pk=course_id,
                    enrollments__student=user,
                    enrollments__status__in=("active", "completed"),
                ).exists()
            else:
                access_by_course[course_id] = False
        return access_by_course[course_id]

    def get_content(self, lesson):
        return lesson.content if self._can_access(lesson) else ""

    def get_video_url(self, lesson):
        return lesson.video_url if self._can_access(lesson) else ""


class ModuleSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = Module
        fields = ("id", "title", "description", "position", "lessons")


class CourseListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    instructor_name = serializers.CharField(source="instructor.get_full_name", read_only=True)

    class Meta:
        model = Course
        fields = (
            "id", "title", "slug", "description", "price", "currency",
            "category", "instructor_name", "published_at",
        )


class CourseDetailSerializer(CourseListSerializer):
    modules = ModuleSerializer(many=True, read_only=True)

    class Meta(CourseListSerializer.Meta):
        fields = CourseListSerializer.Meta.fields + ("modules",)
