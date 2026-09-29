from django.contrib import admin

from .models import (
    AcademicYear,
    ClassRoom,
    Subject,
    Enrollment,
    TeacherSubjectAssignment,
)


@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "start_date",
        "end_date",
        "is_current",
    )

    list_filter = (
        "is_current",
    )


@admin.register(ClassRoom)
class ClassRoomAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "grade",
        "section",
        "academic_year",
        "class_teacher",
    )

    list_filter = (
        "grade",
        "section",
        "academic_year",
    )

    search_fields = (
        "name",
    )


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "code",
        "is_active",
    )

    list_filter = (
        "is_active",
    )

    search_fields = (
        "name",
        "code",
    )


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):

    list_display = (
        "student",
        "classroom",
        "academic_year",
        "is_active",
        "enrollment_date",
    )

    list_filter = (
        "academic_year",
        "classroom",
        "is_active",
    )

    search_fields = (
        "student__student_code",
        "student__user__first_name",
        "student__user__last_name",
    )


@admin.register(TeacherSubjectAssignment)
class TeacherSubjectAssignmentAdmin(admin.ModelAdmin):

    list_display = (
        "teacher",
        "subject",
        "classroom",
        "academic_year",
    )

    list_filter = (
        "subject",
        "classroom",
        "academic_year",
    )

    search_fields = (
        "teacher__username",
        "teacher__first_name",
        "teacher__last_name",
        "subject__name",
    )