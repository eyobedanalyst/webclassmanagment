from django.contrib import admin

from .models import Result


@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):

    list_display = (
        "student",
        "subject",
        "classroom",
        "semester",
        "exam_type",
        "score",
        "max_score",
        "teacher",
        "created_at",
    )

    list_filter = (
        "academic_year",
        "semester",
        "exam_type",
        "subject",
        "classroom",
    )

    search_fields = (
        "student__student_code",
        "student__user__first_name",
        "student__user__last_name",
        "subject__name",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )