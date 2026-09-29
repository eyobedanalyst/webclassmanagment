from rest_framework import serializers

from .models import Result


class ResultSerializer(serializers.ModelSerializer):

    student_name = serializers.CharField(
        source="student.user.get_full_name",
        read_only=True
    )

    student_code = serializers.CharField(
        source="student.student_code",
        read_only=True
    )

    subject_name = serializers.CharField(
        source="subject.name",
        read_only=True
    )

    classroom_name = serializers.CharField(
        source="classroom.name",
        read_only=True
    )

    academic_year_name = serializers.CharField(
        source="academic_year.name",
        read_only=True
    )

    teacher_name = serializers.CharField(
        source="teacher.get_full_name",
        read_only=True
    )

    percentage = serializers.SerializerMethodField()

    status = serializers.SerializerMethodField()

    class Meta:
        model = Result

        fields = [
            "id",

            "student",
            "student_name",
            "student_code",

            "subject",
            "subject_name",

            "classroom",
            "classroom_name",

            "academic_year",
            "academic_year_name",

            "semester",
            "exam_type",
            "title",

            "score",
            "max_score",
            "percentage",
            "status",

            "teacher",
            "teacher_name",

            "comment",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "teacher",
            "percentage",
            "status",
            "created_at",
            "updated_at",
        ]

    def get_percentage(self, obj):
        return round(float(obj.percentage), 2)

    def get_status(self, obj):
        return obj.status

    def validate(self, attrs):

        score = attrs.get(
            "score",
            self.instance.score
            if self.instance
            else None
        )

        max_score = attrs.get(
            "max_score",
            self.instance.max_score
            if self.instance
            else None
        )


        if (
            score is not None
            and max_score is not None
            and score > max_score
        ):

            raise serializers.ValidationError({
                "score": (
                    "Score cannot be greater "
                    "than maximum score."
                )
            })


        student = attrs.get(
            "student",
            self.instance.student
            if self.instance
            else None
        )

        classroom = attrs.get(
            "classroom",
            self.instance.classroom
            if self.instance
            else None
        )

        academic_year = attrs.get(
            "academic_year",
            self.instance.academic_year
            if self.instance
            else None
        )

        subject = attrs.get(
            "subject",
            self.instance.subject
            if self.instance
            else None
        )


        if (
            student
            and classroom
            and academic_year
        ):

            from academics.models import Enrollment

            enrolled = (
                Enrollment.objects
                .filter(
                    student=student,
                    classroom=classroom,
                    academic_year=academic_year,
                    is_active=True,
                )
                .exists()
            )

            if not enrolled:

                raise serializers.ValidationError({
                    "student": (
                        "This student is not enrolled "
                        "in the selected class for "
                        "this academic year."
                    )
                })


        request = self.context.get(
            "request"
        )


        if (
            request
            and request.user.role == "TEACHER"
            and subject
            and classroom
            and academic_year
        ):

            from academics.models import (
                TeacherSubjectAssignment
            )

            assigned = (
                TeacherSubjectAssignment.objects
                .filter(
                    teacher=request.user,
                    subject=subject,
                    classroom=classroom,
                    academic_year=academic_year,
                )
                .exists()
            )

            if not assigned:

                raise serializers.ValidationError({
                    "subject": (
                        "You are not assigned "
                        "to this subject and class "
                        "for this academic year."
                    )
                })


        return attrs