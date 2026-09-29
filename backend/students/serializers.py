from rest_framework import serializers

from .models import StudentProfile


class StudentProfileSerializer(serializers.ModelSerializer):

    # User information
    user_id = serializers.IntegerField(
        source="user.id",
        read_only=True
    )

    username = serializers.CharField(
        source="user.username",
        read_only=True
    )

    first_name = serializers.CharField(
        source="user.first_name",
        read_only=True
    )

    last_name = serializers.CharField(
        source="user.last_name",
        read_only=True
    )

    email = serializers.EmailField(
        source="user.email",
        read_only=True
    )

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile

        fields = [
            "id",

            # User information
            "user_id",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "email",

            # Student information
            "student_code",
            "gender",
            "date_of_birth",
            "phone",
            "address",
            "guardian_name",
            "guardian_phone",
            "photo",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "user_id",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "created_at",
            "updated_at",
        ]

    def get_full_name(self, obj):
        return obj.user.get_full_name()