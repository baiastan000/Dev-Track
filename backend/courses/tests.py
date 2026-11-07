from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from rest_framework.test import APIClient

from users.serializers import RegistrationSerializer

from .models import Category, Course, Enrollment, Lesson, LessonProgress, Module


User = get_user_model()


class CourseApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.instructor = User.objects.create_user(
            email="teacher@example.com",
            username="teacher",
            password="SecurePass123!",
            role=User.Role.INSTRUCTOR,
        )
        self.student = User.objects.create_user(
            email="student@example.com",
            username="student",
            password="SecurePass123!",
        )
        self.category = Category.objects.create(name="Python", slug="python")
        self.course = Course.objects.create(
            title="Python basics",
            slug="python-basics",
            description="Learn Python.",
            price="25.00",
            currency="USD",
            category=self.category,
            instructor=self.instructor,
            status=Course.Status.PUBLISHED,
        )
        module = Module.objects.create(course=self.course, title="Start", position=1)
        self.preview = Lesson.objects.create(
            module=module, title="Introduction", content="Preview text",
            position=1, is_preview=True,
        )
        self.paid_lesson = Lesson.objects.create(
            module=module, title="Variables", content="Private lesson text",
            position=2,
        )

    def test_public_catalog_only_returns_published_courses(self):
        Course.objects.create(
            title="Draft course",
            slug="draft-course",
            description="Not published.",
            price="0.00",
            category=self.category,
            instructor=self.instructor,
        )

        response = self.client.get("/api/v1/courses/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [course["slug"] for course in response.data["results"]],
            ["python-basics"],
        )

    def test_course_detail_hides_non_preview_content_until_enrolled(self):
        response = self.client.get("/api/v1/courses/python-basics/")
        lessons = response.data["modules"][0]["lessons"]

        self.assertEqual(lessons[0]["content"], "Preview text")
        self.assertEqual(lessons[1]["content"], "")

        Enrollment.objects.create(student=self.student, course=self.course)
        self.client.force_authenticate(self.student)
        response = self.client.get("/api/v1/courses/python-basics/")
        lessons = response.data["modules"][0]["lessons"]

        self.assertEqual(lessons[1]["content"], "Private lesson text")

    def test_dashboard_requires_login_and_returns_only_current_students_courses(self):
        response = self.client.get("/api/v1/dashboard/")
        self.assertEqual(response.status_code, 403)

        Enrollment.objects.create(student=self.student, course=self.course)
        self.client.force_authenticate(self.student)
        response = self.client.get("/api/v1/dashboard/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["enrollments"]), 1)
        self.assertEqual(response.data["enrollments"][0]["course"]["slug"], "python-basics")

    def test_lesson_progress_cannot_cross_course_boundary(self):
        other_course = Course.objects.create(
            title="Other", slug="other", description="", price="0.00",
            category=self.category, instructor=self.instructor,
        )
        enrollment = Enrollment.objects.create(student=self.student, course=other_course)
        with self.assertRaisesMessage(
            ValidationError, "The lesson must belong to the enrolled course."
        ):
            LessonProgress(enrollment=enrollment, lesson=self.paid_lesson).full_clean()

    def test_instructor_can_access_own_course_lessons_only(self):
        self.client.force_authenticate(self.instructor)
        response = self.client.get("/api/v1/courses/python-basics/")
        lessons = response.data["modules"][0]["lessons"]

        self.assertEqual(lessons[1]["content"], "Private lesson text")


class SessionAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient(enforce_csrf_checks=True)

    def test_registration_requires_csrf_and_never_accepts_a_role(self):
        payload = {
            "email": "new@example.com",
            "username": "new-student",
            "password": "StrongPass123!another",
            "role": "admin",
        }
        response = self.client.post(
            "/api/v1/auth/register/", payload, format="json"
        )
        self.assertEqual(response.status_code, 403)

        self.client.get("/api/v1/auth/csrf/")
        csrf_token = self.client.cookies["csrftoken"].value
        response = self.client.post(
            "/api/v1/auth/register/",
            payload,
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["user"]["role"], User.Role.STUDENT)
        self.assertTrue(User.objects.get(email="new@example.com").profile)

    def test_registration_normalizes_email_case(self):
        User.objects.create_user(
            email="existing@example.com",
            username="existing",
            password="SecurePass123!",
        )
        serializer = RegistrationSerializer(
            data={
                "email": "EXISTING@example.com",
                "username": "duplicate",
                "password": "SecurePass123!new",
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)
