from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomLoginView,
    CurrentUserView,
    TeacherViewSet,
)


router = DefaultRouter()

router.register(
    "teachers",
    TeacherViewSet,
    basename="teachers"
)


urlpatterns = [
    path(
        "login/",
        CustomLoginView.as_view(),
        name="login"
    ),

    path(
        "refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh"
    ),

    path(
        "me/",
        CurrentUserView.as_view(),
        name="current_user"
    ),
]

urlpatterns += router.urls