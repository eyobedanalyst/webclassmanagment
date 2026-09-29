from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    StudentProfileViewSet,
    TeacherClassStudentsView,
    TeacherStudentDetailView,
    TeacherStudentUpdateView,
)


router = DefaultRouter()

router.register(
    "students",
    StudentProfileViewSet,
    basename="students"
)


urlpatterns = [

    path(
        "students/teacher-class/<int:classroom_id>/students/",
        TeacherClassStudentsView.as_view(),
        name="teacher-class-students"
    ),

    path(
        "students/teacher/<int:student_id>/",
        TeacherStudentDetailView.as_view(),
        name="teacher-student-detail"
    ),

    path(
        "students/teacher/<int:student_id>/update/",
        TeacherStudentUpdateView.as_view(),
        name="teacher-student-update"
    ),
]


urlpatterns += router.urls