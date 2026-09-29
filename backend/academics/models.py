from django.db import models
from django.conf import settings


class AcademicYear(models.Model):
    name = models.CharField(
        max_length=20,
        unique=True
    )

    start_date = models.DateField()

    end_date = models.DateField()

    is_current = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ["-start_date"]

    def __str__(self):
        return self.name


class ClassRoom(models.Model):
    grade = models.PositiveIntegerField()

    section = models.CharField(
        max_length=10
    )

    name = models.CharField(
        max_length=50
    )

    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.CASCADE,
        related_name="classes"
    )

    class_teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_classes",
        limit_choices_to={"role": "TEACHER"}
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ["grade", "section"]
        constraints = [
            models.UniqueConstraint(
                fields=["grade", "section", "academic_year"],
                name="unique_class_per_academic_year"
            )
        ]

    def __str__(self):
        return f"{self.name} - {self.academic_year.name}"


class Subject(models.Model):
    name = models.CharField(
        max_length=100
    )

    code = models.CharField(
        max_length=20,
        unique=True
    )

    description = models.TextField(
        blank=True
    )

    is_active = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.code})"


class Enrollment(models.Model):
    student = models.ForeignKey(
        "students.StudentProfile",
        on_delete=models.CASCADE,
        related_name="enrollments"
    )

    classroom = models.ForeignKey(
        ClassRoom,
        on_delete=models.CASCADE,
        related_name="enrollments"
    )

    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.CASCADE,
        related_name="enrollments"
    )

    enrollment_date = models.DateField(
        auto_now_add=True
    )

    is_active = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["student", "academic_year"],
                name="one_class_per_student_per_year"
            )
        ]

    def __str__(self):
        return (
            f"{self.student} → "
            f"{self.classroom} "
            f"({self.academic_year.name})"
        )


class TeacherSubjectAssignment(models.Model):
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subject_assignments",
        limit_choices_to={"role": "TEACHER"}
    )

    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name="teacher_assignments"
    )

    classroom = models.ForeignKey(
        ClassRoom,
        on_delete=models.CASCADE,
        related_name="teacher_assignments"
    )

    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.CASCADE,
        related_name="teacher_assignments"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "teacher",
                    "subject",
                    "classroom",
                    "academic_year"
                ],
                name="unique_teacher_subject_class"
            )
        ]

    def __str__(self):
        return (
            f"{self.teacher.get_full_name()} - "
            f"{self.subject.name} - "
            f"{self.classroom.name}"
        )