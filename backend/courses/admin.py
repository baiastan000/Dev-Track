from django.contrib import admin

from .models import Category, Course, Enrollment, Lesson, LessonProgress, Module


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 0


class ModuleInline(admin.TabularInline):
    model = Module
    extra = 0


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "instructor", "price", "status", "published_at")
    list_filter = ("status", "category")
    search_fields = ("title", "description")
    prepopulated_fields = {"slug": ("title",)}
    inlines = (ModuleInline,)


admin.site.register(Category)
admin.site.register(Enrollment)
admin.site.register(Lesson)
admin.site.register(LessonProgress)
