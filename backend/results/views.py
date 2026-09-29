from django.db.models import Q

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from academics.models import TeacherSubjectAssignment

from .models import Result
from .serializers import ResultSerializer


class ResultViewSet(viewsets.ModelViewSet):

    serializer_class = ResultSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        user = self.request.user

        queryset = Result.objects.select_related(
            "student__user",
            "subject",
            "classroom",
            "academic_year",
            "teacher",
        )

        # --------------------------------------------------
        # 1. SECURITY FILTER
        # --------------------------------------------------

        if user.role == "STUDENT":

            queryset = queryset.filter(
                student__user=user
            )

        elif user.role == "TEACHER":

            assignments = TeacherSubjectAssignment.objects.filter(
                teacher=user
            )

            if not assignments.exists():
                return Result.objects.none()

            allowed_query = Q()

            for assignment in assignments:

                allowed_query |= Q(
                    classroom=assignment.classroom,
                    subject=assignment.subject,
                    academic_year=assignment.academic_year
                )

            queryset = queryset.filter(
                allowed_query
            )

        elif user.role == "ADMIN":

            pass

        else:

            return Result.objects.none()

        # --------------------------------------------------
        # 2. CLASS FILTER
        # --------------------------------------------------

        classroom_id = self.request.query_params.get(
            "classroom"
        )

        if classroom_id:
            queryset = queryset.filter(
                classroom_id=classroom_id
            )

        # --------------------------------------------------
        # 3. SUBJECT FILTER
        # --------------------------------------------------

        subject_id = self.request.query_params.get(
            "subject"
        )

        if subject_id:
            queryset = queryset.filter(
                subject_id=subject_id
            )

        # --------------------------------------------------
        # 4. SEMESTER FILTER
        # --------------------------------------------------

        semester = self.request.query_params.get(
            "semester"
        )

        if semester:
            queryset = queryset.filter(
                semester=semester
            )

        # --------------------------------------------------
        # 5. EXAM TYPE FILTER
        # --------------------------------------------------

        exam_type = self.request.query_params.get(
            "exam_type"
        )

        if exam_type:
            queryset = queryset.filter(
                exam_type=exam_type
            )

        # --------------------------------------------------
        # 6. STUDENT SEARCH
        # --------------------------------------------------

        student_id = self.request.query_params.get("student")

        if student_id:
            queryset = queryset.filter(
                student_id=student_id
            )


        search = self.request.query_params.get("search")

        if search:
            queryset = queryset.filter(
                Q(student__user__first_name__icontains=search)
                |
                Q(student__user__last_name__icontains=search)
                |
                Q(student__student_code__icontains=search)
            )

        return queryset

    # ------------------------------------------------------
    # CREATE RESULT
    # ------------------------------------------------------

    def perform_create(self, serializer):

        user = self.request.user

        if user.role == "ADMIN":

            serializer.save(
                teacher=user
            )

            return

        if user.role != "TEACHER":

            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                "Only teachers and admins can create results."
            )

        classroom = serializer.validated_data[
            "classroom"
        ]

        subject = serializer.validated_data[
            "subject"
        ]

        academic_year = serializer.validated_data[
            "academic_year"
        ]

        assignment_exists = (
            TeacherSubjectAssignment.objects.filter(
                teacher=user,
                classroom=classroom,
                subject=subject,
                academic_year=academic_year
            ).exists()
        )

        if not assignment_exists:

            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                "You are not assigned to this subject and class."
            )

        serializer.save(
            teacher=user
        )

    # ------------------------------------------------------
    # UPDATE RESULT
    # ------------------------------------------------------

    def perform_update(self, serializer):

        user = self.request.user

        result = self.get_object()

        if user.role == "ADMIN":

            serializer.save()

            return

        if user.role != "TEACHER":

            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                "Only teachers and admins can edit results."
            )

        if result.teacher != user:

            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                "You can only edit results that you entered."
            )

        serializer.save()

    # ------------------------------------------------------
    # DELETE RESULT
    # ------------------------------------------------------

    def perform_destroy(self, instance):

        user = self.request.user

        if user.role == "ADMIN":

            instance.delete()

            return

        if user.role == "TEACHER":

            if instance.teacher == user:

                instance.delete()

                return

        from rest_framework.exceptions import PermissionDenied

        raise PermissionDenied(
            "You are not allowed to delete this result."
        )

    # ------------------------------------------------------
    # STUDENT RESULTS
    # ------------------------------------------------------

    @action(
        detail=False,
        methods=["get"],
        url_path="my-results"
    )
    def my_results(self, request):

        if request.user.role != "STUDENT":

            return Response(
                {
                    "detail": (
                        "This endpoint is only "
                        "available to students."
                    )
                },
                status=403
            )

        results = self.get_queryset()

        serializer = self.get_serializer(
            results,
            many=True
        )

        return Response(
            serializer.data
        )

    # ------------------------------------------------------
    # RESULTS SUMMARY
    # ------------------------------------------------------

    @action(
        detail=False,
        methods=["get"],
        url_path="summary"
    )
    def summary(self, request):

        results = list(
            self.get_queryset()
        )

        total_results = len(results)

        if total_results == 0:

            return Response({
                "total_results": 0,
                "average_percentage": 0,
                "passed": 0,
                "failed": 0,
            })

        percentages = [
            float(result.percentage)
            for result in results
        ]

        average_percentage = (
            sum(percentages)
            / len(percentages)
        )

        passed = sum(
            1
            for result in results
            if result.status == "PASS"
        )

        failed = sum(
            1
            for result in results
            if result.status == "FAIL"
        )

        return Response({
            "total_results": total_results,
            "average_percentage": round(
                average_percentage,
                2
            ),
            "passed": passed,
            "failed": failed,
        })