from django.urls import path

from .views import (
    CurrentAcademicYearView,
    MyTeacherAssignmentsView,
    EnrollmentManagementView,
    EnrollmentManagementDetailView,
)


urlpatterns = [

    path(
        "academic-years/current/",
        CurrentAcademicYearView.as_view(),
        name="current-academic-year"
    ),

    path(
        "teacher-assignments/my/",
        MyTeacherAssignmentsView.as_view(),
        name="my-teacher-assignments"
    ),

    path(
        "enrollment-management/",
        EnrollmentManagementView.as_view(),
        name="enrollment-management"
    ),

    path(
        "enrollment-management/<int:enrollment_id>/",
        EnrollmentManagementDetailView.as_view(),
        name="enrollment-management-detail"
    ),
]