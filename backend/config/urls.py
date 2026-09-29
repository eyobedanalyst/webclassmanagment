from django.contrib import admin
from django.urls import include, path


urlpatterns = [

    path(
        "admin/",
        admin.site.urls
    ),

    # Authentication + teachers
    path(
        "api/auth/",
        include("accounts.urls")
    ),

    # Students
    path(
        "api/",
        include("students.urls")
    ),

    # Academic data
    path(
        "api/",
        include("academics.urls")
    ),

    # Results
    path(
        "api/",
        include("results.urls")
    ),

]