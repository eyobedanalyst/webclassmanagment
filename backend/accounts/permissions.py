from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """
    Allows access only to users with ADMIN role.
    """

    message = "Admin access required."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


class IsTeacherRole(BasePermission):
    """
    Allows access only to users with TEACHER role.
    """

    message = "Teacher access required."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "TEACHER"
        )


class IsStudentRole(BasePermission):
    """
    Allows access only to users with STUDENT role.
    """

    message = "Student access required."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "STUDENT"
        )


class IsAdminOrTeacher(BasePermission):
    """
    Allows access to admins and teachers.
    """

    message = "Admin or teacher access required."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ["ADMIN", "TEACHER"]
        )