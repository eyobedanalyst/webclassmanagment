from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.conf import settings


class Result(models.Model):

    class Semester(models.TextChoices):
        SEMESTER_1 = "SEMESTER_1", "Semester 1"
        SEMESTER_2 = "SEMESTER_2", "Semester 2"

    class ExamType(models.TextChoices):
        QUIZ = "QUIZ", "Quiz"
        ASSIGNMENT = "ASSIGNMENT", "Assignment"
        MIDTERM = "MIDTERM", "Midterm"
        FINAL = "FINAL", "Final Exam"
        PROJECT = "PROJECT", "Project"
        PRACTICAL = "PRACTICAL", "Practical"
        OTHER = "OTHER", "Other"

    student = models.ForeignKey(
        "students.StudentProfile",
        on_delete=models.CASCADE,
        related_name="results"
    )

    subject = models.ForeignKey(
        "academics.Subject",
        on_delete=models.PROTECT,
        related_name="results"
    )

    classroom = models.ForeignKey(
        "academics.ClassRoom",
        on_delete=models.PROTECT,
        related_name="results"
    )

    academic_year = models.ForeignKey(
        "academics.AcademicYear",
        on_delete=models.PROTECT,
        related_name="results"
    )

    semester = models.CharField(
        max_length=20,
        choices=Semester.choices
    )

    exam_type = models.CharField(
        max_length=20,
        choices=ExamType.choices
    )

    title = models.CharField(
        max_length=150,
        blank=True
    )

    score = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0"))
        ]
    )

    max_score = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.01"))
        ]
    )

    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="entered_results",
        limit_choices_to={"role": "TEACHER"}
    )

    comment = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = [
            "-academic_year",
            "semester",
            "subject",
            "student"
        ]

    def clean(self):
            if self.score > self.max_score:
                raise ValidationError({
                    "score": "Score cannot be greater than the maximum score."
                })

            if self.student:
                from academics.models import Enrollment

                enrollment_exists = Enrollment.objects.filter(
                    student=self.student,
                    classroom=self.classroom,
                    academic_year=self.academic_year,
                    is_active=True
                ).exists()

                if not enrollment_exists:
                    raise ValidationError(
                        "The student is not enrolled in this class "
                        "for this academic year."
                    )

    def __str__(self):
        return (
            f"{self.student} - "
            f"{self.subject.name} - "
            f"{self.exam_type} - "
            f"{self.score}/{self.max_score}"
        )

    @property
    def percentage(self):
        if self.max_score == 0:
            return Decimal("0")

        return (
            self.score / self.max_score
        ) * Decimal("100")

    @property
    def status(self):
        if self.percentage >= Decimal("50"):
            return "PASS"

        return "FAIL"