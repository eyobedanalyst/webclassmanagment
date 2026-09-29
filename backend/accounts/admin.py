from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User, TeacherProfile


@admin.register(User)
class CustomUserAdmin(UserAdmin):

    fieldsets = UserAdmin.fieldsets + (
        (
            "Role Information",
            {
                "fields": ("role",)
            }
        ),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "Role Information",
            {
                "fields": ("role",)
            }
        ),
    )


@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = (
        "employee_id",
        "user",
        "department",
        "phone",
    )

    search_fields = (
        "employee_id",
        "user__username",
        "user__first_name",
        "user__last_name",
    )