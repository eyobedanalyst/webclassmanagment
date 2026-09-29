from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import TeacherSerializer
from .models import User
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
)
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    UserSerializer,
    CustomTokenObtainPairSerializer,
    TeacherSerializer,
)

class CustomLoginView(TokenObtainPairView):

    serializer_class = (
        CustomTokenObtainPairSerializer
    )


class CurrentUserView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request):

        user = request.user

        data = {
            "user": UserSerializer(user).data,
        }

        if user.role == "STUDENT":

            try:

                student = user.student_profile

                data["student"] = {
                    "id": student.id,
                    "student_code": (
                        student.student_code
                    ),
                    "gender": student.gender,
                    "phone": student.phone,
                    "guardian_name": (
                        student.guardian_name
                    ),
                }

            except Exception:

                data["student"] = None

        elif user.role == "TEACHER":

            try:

                teacher = user.teacher_profile

                data["teacher"] = {
                    "id": teacher.id,
                    "employee_id": (
                        teacher.employee_id
                    ),
                    "phone": teacher.phone,
                    "department": (
                        teacher.department
                    ),
                }

            except Exception:

                data["teacher"] = None

        return Response(data)


class TeacherViewSet(viewsets.ReadOnlyModelViewSet):

    serializer_class = TeacherSerializer

    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):

        user = self.request.user

        # ADMIN
        if user.role == "ADMIN":

            return User.objects.filter(
                role="TEACHER"
            ).order_by(
                "first_name",
                "last_name"
            )

        # TEACHER
        if user.role == "TEACHER":

            return User.objects.filter(
                id=user.id,
                role="TEACHER"
            )

        # STUDENT
        if user.role == "STUDENT":

            from academics.models import (
                TeacherSubjectAssignment
            )

            teacher_ids = (
                TeacherSubjectAssignment.objects.filter(
                    classroom__enrollments__student__user=user,
                    classroom__enrollments__is_active=True
                )
                .values_list(
                    "teacher_id",
                    flat=True
                )
                .distinct()
            )

            return User.objects.filter(
                id__in=teacher_ids,
                role="TEACHER"
            )

        return User.objects.none()

    @action(
        detail=False,
        methods=["get"],
        url_path="me"
    )
    def me(self, request):

        if request.user.role != "TEACHER":

            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                "This endpoint is only available to teachers."
            )

        serializer = self.get_serializer(
            request.user
        )

        return Response(
            serializer.data
        )