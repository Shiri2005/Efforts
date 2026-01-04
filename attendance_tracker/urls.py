from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from students.views import MyTokenObtainPairView

from students.views import (
    StudentViewSet,
    TeacherViewSet,
    AttendanceViewSet,
    SubjectViewSet,
    restore_session
)

router = routers.DefaultRouter()
router.register(r'students', StudentViewSet)
router.register(r'teachers', TeacherViewSet)
router.register(r'attendance', AttendanceViewSet, basename='attendance')

router.register(r'subjects', SubjectViewSet, basename="subject")

urlpatterns = [
    path('admin/', admin.site.urls),

    # 🔐 JWT
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path("api/attendance/restore-session/<str:session_id>/", restore_session, name="restore-session"),
    # 🔁 API ROUTES
    path('api/', include(router.urls)),
    path('api/', include('students.urls')),  # ✅ ONLY THIS
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
