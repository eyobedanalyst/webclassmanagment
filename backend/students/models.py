from django.db import models
from django.conf import settings


class StudentProfile(models.Model):

    class Gender(models.TextChoices):
        MALE = "M", "Male"
        FEMALE = "F", "Female"
        OTHER = "O", "Other"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="student_profile"
    )

    student_code = models.CharField(
        max_length=50,
        unique=True
    )

    gender = models.CharField(
        max_length=1,
        choices=Gender.choices,
        blank=True
    )

    date_of_birth = models.DateField(
        null=True,
        blank=True
    )

    phone = models.CharField(
        max_length=20,
        blank=True
    )

    address = models.TextField(
        blank=True
    )

    guardian_name = models.CharField(
        max_length=150,
        blank=True
    )

    guardian_phone = models.CharField(
        max_length=20,
        blank=True
    )

    photo = models.ImageField(
        upload_to="students/",
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return (
            f"{self.user.get_full_name()} "
            f"({self.student_code})"
        )