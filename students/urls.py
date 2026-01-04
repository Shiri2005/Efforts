from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    # -----------------------------
    # AUTH (HTML - optional)
    # -----------------------------
    path('login/', auth_views.LoginView.as_view(template_name='students/login.html'), name='student-login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='student-login'), name='student-logout'),

    # -----------------------------
    # API ENDPOINTS
    # -----------------------------
    path('student/profile/', views.get_student_profile, name='student-profile'),
    path('teacher/profile/', views.teacher_profile, name='teacher-profile'),
    path('teacher/students/', views.get_students_for_teacher, name='students-for-teacher'),
    path('upload-students/', views.upload_students, name='upload-students'),

    # 🔥 NEW: CHANGE PASSWORD API
    path('change-password/', views.change_password, name='change-password'),
]
