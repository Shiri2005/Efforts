from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.contrib.auth.models import User
import pandas as pd
from django.contrib.auth.password_validation import validate_password
import uuid
from django.db.models import Count
from django.db import models

from .models import Student, Teacher, Attendance, Subject
from .serializer import (
    StudentSerializer,
    TeacherSerializer,
    AttendanceSerializer,
    SubjectSerializer,
    MyTokenObtainPairSerializer,
)
from rest_framework_simplejwt.views import TokenObtainPairView

from rest_framework import status
from django.db import IntegrityError
# -----------------------------
# CUSTOM PERMISSIONS
# -----------------------------
class IsTeacherOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return Teacher.objects.filter(user=request.user).exists()


# -----------------------------
# TOKEN VIEW
# -----------------------------
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


# -----------------------------
# SUBJECT VIEWSET
# -----------------------------
class SubjectViewSet(viewsets.ModelViewSet):
   serializer_class = SubjectSerializer
   permission_classes = [permissions.IsAuthenticated]

   def get_queryset(self):
        teacher = Teacher.objects.filter(user=self.request.user).first()
        if teacher:
            return Subject.objects.filter(teacher=teacher)
        return Subject.objects.none()


# -----------------------------
# STUDENT VIEWSET
# -----------------------------
class StudentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Student.objects.all()

    def get_queryset(self):
        user = self.request.user
        student = Student.objects.filter(user=user).first()
        if student:
            return Student.objects.filter(pk=student.pk)
        return Student.objects.none()

    @action(detail=True, methods=["get"])
    def attendance_summary(self, request, pk=None):
        student = self.get_object()
        qs = Attendance.objects.filter(student=student, is_deleted=False)
        total_classes = qs.count()
        present_count = qs.filter(status="Present").count()
        percentage = (present_count / total_classes * 100) if total_classes > 0 else 0

        return Response({
            "student_id": student.id,
            "name": student.full_name,
            "total_classes": total_classes,
            "present_days": present_count,
            "attendance_percentage": round(percentage, 2),
        })


# -----------------------------
# TEACHER VIEWSET
# -----------------------------
class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=["get"])
    def profile(self, request):
        teacher = Teacher.objects.filter(user=request.user).first()
        if not teacher:
            return Response({"detail": "Teacher profile not found"}, status=404)
        serializer = self.get_serializer(teacher)
        return Response(serializer.data)


# -----------------------------
# ATTENDANCE VIEWSET
# -----------------------------
class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if Teacher.objects.filter(user=user).exists():
           teacher = Teacher.objects.get(user=user)
           return Attendance.objects.filter(
             subject__teacher=teacher,
             is_deleted=False
            )
        return Attendance.objects.filter(
        student__user=user,
        is_deleted=False
    )


        
    def create(self, request, *args, **kwargs):
        data = request.data
        is_many = isinstance(data, list)

        batch_session_id = str(uuid.uuid4())

        session_num = 1
        if is_many and len(data) > 0:
            session_num = data[0].get("session", 1)
        elif not is_many:
            session_num = data.get("session", 1)

        serializer = self.get_serializer(data=data, many=is_many)
        serializer.is_valid(raise_exception=True)

        try:
            serializer.save(
                recorded_by=request.user,
                session_id=batch_session_id,
                session=session_num,
                semester=data[0]["semester"] if isinstance(data, list) else data["semester"],
                section=data[0]["section"] if isinstance(data, list) else data["section"],

            )
        except IntegrityError:
            return Response(
                {"detail": "Attendance already marked for this subject, date, and period"},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {"message": "Attendance saved successfully"},
            status=status.HTTP_201_CREATED
        )
        # -----------------------------
# 🔥 NEW: VIEW DELETED SESSIONS (for undo)
# -----------------------------
    @action(detail=False, methods=["get"], url_path="teacher-deleted")
    def deleted_sessions(self, request):
        teacher = Teacher.objects.filter(user=request.user).first()
        if not teacher:
            return Response({"error": "Teacher not found"}, status=404)

        deleted = (
            Attendance.objects
            .filter(subject__teacher=teacher, is_deleted=True)
            .values("session_id", "date", "subject__name", "session","semester",   # ✅
              "section", )
            .annotate(total=Count("id"))
            .order_by("-date", "-session")
        )

        return Response(deleted)


    @action(detail=False, methods=["get"], url_path="teacher-summary")
    def teacher_attendance_summary(self, request):
        teacher = Teacher.objects.filter(user=request.user).first()
        if not teacher:
            return Response({"error": "Teacher not found"}, status=404)

        attendances = (
            Attendance.objects
            .filter(subject__teacher=teacher, is_deleted=False)
            .values(
                "session_id",
                "date",
                "subject__name",
                "session",
                "student__semester",
                "student__section",
                
            )
            .annotate(
                 
                
                total=Count("id"),
                present=Count("id", filter=models.Q(status="Present")),
                absent=Count("id", filter=models.Q(status="Absent")),
            )
            .order_by("-date", "-session")
        )

        return Response(attendances)

    # -----------------------------
    # 🔥 NEW: VIEW SESSION DETAILS
    # -----------------------------
    @action(detail=False, methods=["get"], url_path="by-session/(?P<session_id>[^/.]+)")
    def by_session(self, request, session_id=None):
        qs = Attendance.objects.filter(
            session_id=session_id,
            is_deleted=False
        )

        if not qs.exists():
            return Response(
                {"error": "No attendance found for this session"},
                status=404
            )

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    # -----------------------------
    # 🔥 NEW: DELETE FULL SESSION
    # -----------------------------
    @action(detail=False, methods=["delete"], url_path="delete-session/(?P<session_id>[^/.]+)")
    def delete_session(self, request, session_id=None):
        if not Teacher.objects.filter(user=request.user).exists():
            return Response(
                {"error": "Only teachers can delete attendance"},
                status=status.HTTP_403_FORBIDDEN
            )

        qs = Attendance.objects.filter(session_id=session_id, is_deleted=False)

        if not qs.exists():
            return Response(
                {"error": "Session not found"},
                status=404
            )

        qs.update(is_deleted=True)

        return Response(
            {"message": "Attendance session deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )

    # -----------------------------
    # SINGLE RECORD DELETE (unchanged)
    # -----------------------------
    def destroy(self, request, *args, **kwargs):
        attendance = self.get_object()

        if not Teacher.objects.filter(user=request.user).exists():
            return Response(
                {"error": "Only teachers can delete attendance"},
                status=status.HTTP_403_FORBIDDEN
            )

        attendance.is_deleted = True
        attendance.save()

        return Response(
            {"message": "Attendance deleted successfully"},
            status=status.HTTP_200_OK
        )


# -----------------------------
# EXTRA APIs
# -----------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_student_profile(request):
    student = Student.objects.filter(user=request.user).first()
    if not student:
        return Response({"error": "Student profile not found"}, status=404)
    serializer = StudentSerializer(student)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def teacher_profile(request):
    teacher= Teacher.objects.filter(user=request.user).prefetch_related('subjects').first()
    if not teacher:
        return Response({"detail": "Teacher profile not found"}, status=404)
    serializer = TeacherSerializer(teacher)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_students_for_teacher(request):
    teacher = Teacher.objects.filter(user=request.user).first()
    if not teacher:
        return Response({"error": "Teacher profile not found"}, status=404)

    section = request.query_params.get("section")
    semester = request.query_params.get("semester")
    subject_id = request.query_params.get("subject")
    if not section or not semester:
        return Response(
            {"error": "section and semester are required"},
            status=400
        )

    subject = Subject.objects.filter(
       id=subject_id,
       teacher=teacher,
       semester=semester
    ).first()

    if not subject:
        return Response(
        {"error": "Invalid subject for this teacher"},
        status=400
    )
     # 🔥 CRITICAL CHECK
    if section not in subject.sections:
        return Response(
            {"error": "Teacher does not handle this section for the subject"},
            status=400
        )

    students = Student.objects.filter(
        department=teacher.department,
        semester=semester,
        section=section,
      
   )

    serializer = StudentSerializer(students, many=True)
    return Response(serializer.data)
 


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_students(request):
    file = request.FILES.get("file")
    if not file:
        return Response({"error": "No file uploaded"}, status=400)

    try:
        df = pd.read_excel(file)
    except:
        return Response({"error": "Invalid Excel file"}, status=400)

    created = 0
    for _, row in df.iterrows():
        register_number = str(row["register_number"]).strip()
        user, created_user = User.objects.get_or_create(username=register_number)
        if created_user:
            user.set_password(register_number)
            user.save()

        Student.objects.get_or_create(
            register_number=register_number,
            defaults={
                "user": user,
                "full_name": row["full_name"],
                "department": row["department"],
                "semester": row["semester"],
                "year": row["year"],
                "section": row["section"],
            }
        )
        created += 1

    return Response({"message": "Upload successful", "created_students": created})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    old_password = request.data.get("old_password")
    new_password = request.data.get("new_password")

    if not old_password or not new_password:
        return Response({"error": "Both passwords required"}, status=400)

    if not user.check_password(old_password):
        return Response({"error": "Old password incorrect"}, status=400)

    validate_password(new_password, user)
    user.set_password(new_password)
    user.save()

    return Response({"message": "Password changed successfully"})
# -----------------------------
# 🔥 NEW: RESTORE FULL SESSION
# -----------------------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def restore_session(request, session_id):
    # Only teachers can restore sessions
    if not Teacher.objects.filter(user=request.user).exists():
        return Response(
            {"error": "Only teachers can restore sessions"},
            status=403
        )

    # Get all soft-deleted attendances for this session
    attendances = Attendance.objects.filter(session_id=session_id, is_deleted=True)
    if not attendances.exists():
        return Response(
            {"error": "No deleted session found"},
            status=404
        )

    # Restore the session
    attendances.update(is_deleted=False)

    return Response(
        {"message": "Session restored successfully"},
        status=200
    ) 