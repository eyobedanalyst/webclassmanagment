from rest_framework import serializers

from .models import (
    AcademicYear,
    ClassRoom,
    Subject,
    Enrollment,
    TeacherSubjectAssignment,
)


class AcademicYearSerializer(serializers.ModelSerializer):

    class Meta:
        model = AcademicYear

        fields = [
            "id",
            "name",
            "start_date",
            "end_date",
            "is_current",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]


class ClassRoomSerializer(serializers.ModelSerializer):

    academic_year_name = serializers.CharField(
        source="academic_year.name",
        read_only=True
    )

    class_teacher_name = serializers.SerializerMethodField()

    student_count = serializers.SerializerMethodField()

    class Meta:
        model = ClassRoom

        fields = [
            "id",
            "grade",
            "section",
            "name",
            "academic_year",
            "academic_year_name",
            "class_teacher",
            "class_teacher_name",
            "student_count",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "academic_year_name",
            "class_teacher_name",
            "student_count",
            "created_at",
        ]

    def get_class_teacher_name(self, obj):

        if not obj.class_teacher:
            return None

        return obj.class_teacher.get_full_name()

    def get_student_count(self, obj):

        return obj.enrollments.filter(
            is_active=True
        ).count()


class SubjectSerializer(serializers.ModelSerializer):

    class Meta:
        model = Subject

        fields = [
            "id",
            "name",
            "code",
            "description",
            "is_active",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]


class EnrollmentSerializer(serializers.ModelSerializer):

    student_name = serializers.CharField(
        source="student.user.get_full_name",
        read_only=True
    )

    student_code = serializers.CharField(
        source="student.student_code",
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

    class Meta:
        model = Enrollment

        fields = [
            "id",

            "student",
            "student_name",
            "student_code",

            "classroom",
            "classroom_name",

            "academic_year",
            "academic_year_name",

            "enrollment_date",
            "is_active",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "student_name",
            "student_code",
            "classroom_name",
            "academic_year_name",
            "enrollment_date",
            "created_at",
        ]


class TeacherSubjectAssignmentSerializer(
    serializers.ModelSerializer
):

    teacher_name = serializers.CharField(
        source="teacher.get_full_name",
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

    class Meta:
        model = TeacherSubjectAssignment

        fields = [
            "id",

            "teacher",
            "teacher_name",

            "subject",
            "subject_name",

            "classroom",
            "classroom_name",

            "academic_year",
            "academic_year_name",

            "created_at",
        ]

        read_only_fields = [
            "id",
            "teacher_name",
            "subject_name",
            "classroom_name",
            "academic_year_name",
            "created_at",
        ]


from rest_framework import serializers

from .models import TeacherSubjectAssignment


class MyTeacherAssignmentSerializer(
    serializers.ModelSerializer
):

    subject_name = serializers.CharField(
        source="subject.name",
        read_only=True
    )

    subject_code = serializers.CharField(
        source="subject.code",
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

    class Meta:

        model = TeacherSubjectAssignment

        fields = [
            "id",
            "subject",
            "subject_name",
            "subject_code",
            "classroom",
            "classroom_name",
            "academic_year",
            "academic_year_name",
        ]