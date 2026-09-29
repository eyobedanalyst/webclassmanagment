from rest_framework import viewsets
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from academics.models import (
    Enrollment,
    TeacherSubjectAssignment,
)

from .models import StudentProfile
from .serializers import StudentProfileSerializer


class StudentProfileViewSet(viewsets.ModelViewSet):

    serializer_class = StudentProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        user = self.request.user

        queryset = (
            StudentProfile.objects
            .select_related("user")
            .prefetch_related(
                "enrollments__classroom",
                "enrollments__academic_year",
            )
        )

        if user.role == "ADMIN":
            return queryset

        if user.role == "STUDENT":
            return queryset.filter(user=user)

        if user.role == "TEACHER":

            assignments = (
                TeacherSubjectAssignment.objects
                .filter(teacher=user)
                .values_list(
                    "classroom_id",
                    flat=True
                )
            )

            return queryset.filter(
                enrollments__classroom_id__in=assignments,
                enrollments__is_active=True,
            ).distinct()

        return StudentProfile.objects.none()


class TeacherClassStudentsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, classroom_id):

        if request.user.role != "TEACHER":
            return Response(
                {
                    "detail": "Teacher access required."
                },
                status=403
            )

        assigned = (
            TeacherSubjectAssignment.objects
            .filter(
                teacher=request.user,
                classroom_id=classroom_id
            )
            .exists()
        )

        if not assigned:
            return Response(
                {
                    "detail": (
                        "You are not assigned "
                        "to this class."
                    )
                },
                status=403
            )

        students = (
            StudentProfile.objects
            .filter(
                enrollments__classroom_id=classroom_id,
                enrollments__is_active=True,
            )
            .select_related("user")
            .prefetch_related(
                "enrollments__classroom",
                "enrollments__academic_year",
            )
            .distinct()
        )

        data = []

        for student in students:

            active_enrollment = (
                student.enrollments
                .filter(
                    classroom_id=classroom_id,
                    is_active=True
                )
                .select_related(
                    "classroom",
                    "academic_year"
                )
                .first()
            )

            data.append({

                "id": student.id,

                "student_code":
                    student.student_code,

                "full_name":
                    student.user.get_full_name(),

                "username":
                    student.user.username,

                "email":
                    student.user.email,

                "gender":
                    student.gender,

                "date_of_birth":
                    student.date_of_birth,

                "phone":
                    student.phone,

                "address":
                    student.address,

                "guardian_name":
                    student.guardian_name,

                "guardian_phone":
                    student.guardian_phone,

                "photo":
                    (
                        request.build_absolute_uri(
                            student.photo.url
                        )
                        if student.photo
                        else None
                    ),

                "enrollment": (
                    {
                        "id":
                            active_enrollment.id,

                        "classroom_id":
                            active_enrollment.classroom.id,

                        "classroom_name":
                            active_enrollment.classroom.name,

                        "grade":
                            active_enrollment.classroom.grade,

                        "section":
                            active_enrollment.classroom.section,

                        "academic_year_id":
                            active_enrollment
                            .academic_year.id,

                        "academic_year":
                            active_enrollment
                            .academic_year.name,

                        "enrollment_date":
                            active_enrollment
                            .enrollment_date,

                        "is_active":
                            active_enrollment.is_active,
                    }
                    if active_enrollment
                    else None
                ),
            })

        return Response(data)


class TeacherStudentDetailView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):

        if request.user.role != "TEACHER":
            return Response(
                {
                    "detail":
                        "Teacher access required."
                },
                status=403
            )

        student = (
            StudentProfile.objects
            .select_related("user")
            .prefetch_related(
                "enrollments__classroom",
                "enrollments__academic_year",
            )
            .filter(
                id=student_id
            )
            .first()
        )

        if not student:
            return Response(
                {
                    "detail":
                        "Student not found."
                },
                status=404
            )

        teacher_classrooms = (
            TeacherSubjectAssignment.objects
            .filter(
                teacher=request.user
            )
            .values_list(
                "classroom_id",
                flat=True
            )
        )

        enrollment = (
            student.enrollments
            .filter(
                classroom_id__in=teacher_classrooms,
                is_active=True
            )
            .select_related(
                "classroom",
                "academic_year"
            )
            .first()
        )

        if not enrollment:
            return Response(
                {
                    "detail": (
                        "You are not allowed "
                        "to view this student."
                    )
                },
                status=403
            )

        data = {

            "id":
                student.id,

            "student_code":
                student.student_code,

            "full_name":
                student.user.get_full_name(),

            "first_name":
                student.user.first_name,

            "last_name":
                student.user.last_name,

            "username":
                student.user.username,

            "email":
                student.user.email,

            "gender":
                student.gender,

            "date_of_birth":
                student.date_of_birth,

            "phone":
                student.phone,

            "address":
                student.address,

            "guardian_name":
                student.guardian_name,

            "guardian_phone":
                student.guardian_phone,

            "photo": (
                request.build_absolute_uri(
                    student.photo.url
                )
                if student.photo
                else None
            ),

            "enrollment": {

                "id":
                    enrollment.id,

                "classroom_id":
                    enrollment.classroom.id,

                "classroom_name":
                    enrollment.classroom.name,

                "grade":
                    enrollment.classroom.grade,

                "section":
                    enrollment.classroom.section,

                "academic_year_id":
                    enrollment.academic_year.id,

                "academic_year":
                    enrollment.academic_year.name,

                "enrollment_date":
                    enrollment.enrollment_date,

                "is_active":
                    enrollment.is_active,
            },
        }

        return Response(data)


class TeacherStudentUpdateView(APIView):

    permission_classes = [IsAuthenticated]

    parser_classes = [
        MultiPartParser,
        FormParser,
    ]

    def patch(self, request, student_id):

        if request.user.role != "TEACHER":
            return Response(
                {
                    "detail":
                        "Teacher access required."
                },
                status=403
            )

        student = (
            StudentProfile.objects
            .select_related("user")
            .filter(id=student_id)
            .first()
        )

        if not student:
            return Response(
                {
                    "detail":
                        "Student not found."
                },
                status=404
            )

        teacher_classrooms = (
            TeacherSubjectAssignment.objects
            .filter(
                teacher=request.user
            )
            .values_list(
                "classroom_id",
                flat=True
            )
        )

        allowed = (
            Enrollment.objects
            .filter(
                student=student,
                classroom_id__in=teacher_classrooms,
                is_active=True
            )
            .exists()
        )

        if not allowed:
            return Response(
                {
                    "detail": (
                        "You are not allowed "
                        "to edit this student."
                    )
                },
                status=403
            )

        editable_fields = [
            "phone",
            "address",
            "guardian_name",
            "guardian_phone",
            "photo",
        ]

        for field in editable_fields:

            if field in request.data:

                setattr(
                    student,
                    field,
                    request.data.get(field)
                )

        student.save()

        return Response({
            "message":
                "Student profile updated successfully.",

            "student": {
                "id":
                    student.id,

                "student_code":
                    student.student_code,

                "full_name":
                    student.user.get_full_name(),

                "username":
                    student.user.username,

                "email":
                    student.user.email,

                "gender":
                    student.gender,

                "date_of_birth":
                    student.date_of_birth,

                "phone":
                    student.phone,

                "address":
                    student.address,

                "guardian_name":
                    student.guardian_name,

                "guardian_phone":
                    student.guardian_phone,

                "photo": (
                    request.build_absolute_uri(
                        student.photo.url
                    )
                    if student.photo
                    else None
                ),
            }
        })