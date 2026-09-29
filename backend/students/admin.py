from django.contrib import admin

from .models import StudentProfile


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):

    list_display = (
        "student_code",
        "user",
        "gender",
        "phone",
        "guardian_name",
    )

    search_fields = (
        "student_code",
        "user__username",
        "user__first_name",
        "user__last_name",
    )

    list_filter = (
        "gender",
    )