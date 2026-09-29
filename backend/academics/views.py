from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django.db import IntegrityError
from django.db.models import Q

from .models import (
    AcademicYear,
    ClassRoom,
    Enrollment,
    TeacherSubjectAssignment,
)


class CurrentAcademicYearView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        academic_year = (
            AcademicYear.objects
            .filter(is_current=True)
            .first()
        )

        if not academic_year:

            return Response(
                {
                    "detail": (
                        "No current academic year "
                        "has been configured."
                    )
                },
                status=404
            )

        return Response({

            "id":
                academic_year.id,

            "name":
                academic_year.name,

            "start_date":
                academic_year.start_date,

            "end_date":
                academic_year.end_date,

            "is_current":
                academic_year.is_current,
        })


class MyTeacherAssignmentsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "TEACHER":

            return Response(
                {
                    "detail":
                        "Teacher access required."
                },
                status=403
            )

        assignments = (
            TeacherSubjectAssignment.objects
            .filter(
                teacher=request.user
            )
            .select_related(
                "subject",
                "classroom",
                "academic_year"
            )
        )

        data = []

        for assignment in assignments:

            data.append({

                "id":
                    assignment.id,

                "subject":
                    assignment.subject.id,

                "subject_name":
                    assignment.subject.name,

                "subject_code":
                    assignment.subject.code,

                "classroom":
                    assignment.classroom.id,

                "classroom_name":
                    assignment.classroom.name,

                "academic_year":
                    assignment.academic_year.id,

                "academic_year_name":
                    assignment.academic_year.name,
            })

        return Response(data)


class EnrollmentManagementView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "ADMIN":

            return Response(
                {
                    "detail":
                        "Admin access required."
                },
                status=403
            )

        enrollments = (
            Enrollment.objects
            .select_related(
                "student__user",
                "classroom",
                "academic_year",
            )
            .order_by(
                "-is_active",
                "classroom__grade",
                "classroom__section",
                "student__user__first_name",
                "student__user__last_name",
            )
        )

        search = request.query_params.get(
            "search"
        )

        classroom_id = request.query_params.get(
            "classroom"
        )

        academic_year_id = request.query_params.get(
            "academic_year"
        )

        is_active = request.query_params.get(
            "is_active"
        )

        if search:

            enrollments = enrollments.filter(
                Q(
                    student__user__first_name__icontains=search
                )
                |
                Q(
                    student__user__last_name__icontains=search
                )
                |
                Q(
                    student__student_code__icontains=search
                )
                |
                Q(
                    student__user__username__icontains=search
                )
            )

        if classroom_id:

            enrollments = enrollments.filter(
                classroom_id=classroom_id
            )

        if academic_year_id:

            enrollments = enrollments.filter(
                academic_year_id=academic_year_id
            )

        if is_active in ["true", "false"]:

            enrollments = enrollments.filter(
                is_active=is_active == "true"
            )

        data = []

        for enrollment in enrollments:

            student = enrollment.student

            data.append({

                "id":
                    enrollment.id,

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

                    "photo": (
                        request.build_absolute_uri(
                            student.photo.url
                        )
                        if student.photo
                        else None
                    ),
                },

                "classroom": {

                    "id":
                        enrollment.classroom.id,

                    "name":
                        enrollment.classroom.name,

                    "grade":
                        enrollment.classroom.grade,

                    "section":
                        enrollment.classroom.section,
                },

                "academic_year": {

                    "id":
                        enrollment.academic_year.id,

                    "name":
                        enrollment.academic_year.name,
                },

                "enrollment_date":
                    enrollment.enrollment_date,

                "is_active":
                    enrollment.is_active,
            })

        return Response(data)

    def post(self, request):

        if request.user.role != "ADMIN":

            return Response(
                {
                    "detail":
                        "Admin access required."
                },
                status=403
            )

        student_id = request.data.get(
            "student"
        )

        classroom_id = request.data.get(
            "classroom"
        )

        academic_year_id = request.data.get(
            "academic_year"
        )

        if not student_id:

            return Response(
                {
                    "detail":
                        "Student is required."
                },
                status=400
            )

        if not classroom_id:

            return Response(
                {
                    "detail":
                        "Classroom is required."
                },
                status=400
            )

        if not academic_year_id:

            return Response(
                {
                    "detail":
                        "Academic year is required."
                },
                status=400
            )

        from students.models import StudentProfile

        student = (
            StudentProfile.objects
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

        classroom = (
            ClassRoom.objects
            .filter(id=classroom_id)
            .first()
        )

        if not classroom:

            return Response(
                {
                    "detail":
                        "Classroom not found."
                },
                status=404
            )

        academic_year = (
            AcademicYear.objects
            .filter(id=academic_year_id)
            .first()
        )

        if not academic_year:

            return Response(
                {
                    "detail":
                        "Academic year not found."
                },
                status=404
            )

        existing = (
            Enrollment.objects
            .filter(
                student=student,
                academic_year=academic_year
            )
            .first()
        )

        if existing:

            return Response(
                {
                    "detail": (
                        "This student is already "
                        "enrolled for this academic year."
                    ),

                    "existing_enrollment": {
                        "id":
                            existing.id,

                        "classroom":
                            existing.classroom.name,

                        "is_active":
                            existing.is_active,
                    }
                },
                status=400
            )

        try:

            enrollment = Enrollment.objects.create(
                student=student,
                classroom=classroom,
                academic_year=academic_year,
                is_active=True
            )

        except IntegrityError:

            return Response(
                {
                    "detail": (
                        "This student already has "
                        "an enrollment for this academic year."
                    )
                },
                status=400
            )

        return Response(
            {
                "message":
                    "Student enrolled successfully.",

                "enrollment": {
                    "id":
                        enrollment.id,

                    "student":
                        student.user.get_full_name(),

                    "student_code":
                        student.student_code,

                    "classroom":
                        classroom.name,

                    "academic_year":
                        academic_year.name,

                    "is_active":
                        enrollment.is_active,
                }
            },
            status=201
        )


class EnrollmentManagementDetailView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request, enrollment_id):

        if request.user.role != "ADMIN":

            return Response(
                {
                    "detail":
                        "Admin access required."
                },
                status=403
            )

        enrollment = (
            Enrollment.objects
            .select_related(
                "student__user",
                "classroom",
                "academic_year"
            )
            .filter(
                id=enrollment_id
            )
            .first()
        )

        if not enrollment:

            return Response(
                {
                    "detail":
                        "Enrollment not found."
                },
                status=404
            )

        classroom_id = request.data.get(
            "classroom"
        )

        is_active = request.data.get(
            "is_active"
        )

        if classroom_id:

            classroom = (
                ClassRoom.objects
                .filter(
                    id=classroom_id
                )
                .first()
            )

            if not classroom:

                return Response(
                    {
                        "detail":
                            "Classroom not found."
                    },
                    status=404
                )

            duplicate = (
                Enrollment.objects
                .filter(
                    student=enrollment.student,
                    academic_year=enrollment.academic_year,
                    classroom=classroom
                )
                .exclude(
                    id=enrollment.id
                )
                .exists()
            )

            if duplicate:

                return Response(
                    {
                        "detail": (
                            "The student already has "
                            "this class enrollment."
                        )
                    },
                    status=400
                )

            enrollment.classroom = classroom

        if is_active is not None:

            if isinstance(
                is_active,
                str
            ):

                enrollment.is_active = (
                    is_active.lower() == "true"
                )

            else:

                enrollment.is_active = bool(
                    is_active
                )

        enrollment.save()

        return Response({

            "message":
                "Enrollment updated successfully.",

            "enrollment": {

                "id":
                    enrollment.id,

                "student":
                    enrollment.student.user.get_full_name(),

                "student_code":
                    enrollment.student.student_code,

                "classroom":
                    enrollment.classroom.name,

                "academic_year":
                    enrollment.academic_year.name,

                "is_active":
                    enrollment.is_active,
            }
        })