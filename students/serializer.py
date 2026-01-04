from rest_framework import serializers
from .models import Student, Attendance, Teacher, Subject
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password


# -----------------------------
# Subject Serializer
# -----------------------------
class SubjectSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()



    class Meta:
        model = Subject
        fields = ['id', 'name', 'code', 'teacher', 'teacher_name', 'department', 'semester','sections']
    def get_teacher_name(self, obj):
        if obj.teacher:
            full_name = obj.teacher.user.get_full_name()
            # fallback to username if full_name is empty
            return full_name if full_name.strip() else obj.teacher.user.username
        return ""

# -----------------------------
# Custom JWT Token Serializer
# -----------------------------
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['is_staff'] = user.is_staff
        token['username'] = user.username
        token['must_change_password'] = not user.has_usable_password()
        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        data["is_staff"] = self.user.is_staff
        data["username"] = self.user.username

        # 🔥 FORCE CHANGE IF PASSWORD == USERNAME
        data["must_change_password"] =( self.user.check_password(self.user.username))

        return data
# -----------------------------
# NEW: Change Password Serializer
# -----------------------------
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value


# -----------------------------
# User Serializer
# -----------------------------
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


# -----------------------------
# Student Serializer
# -----------------------------
class StudentSerializer(serializers.ModelSerializer):
    attendance_percentage = serializers.SerializerMethodField()
    img_url = serializers.SerializerMethodField()
    subjects = SubjectSerializer(many=True, read_only=True)

    class Meta:
        model = Student
        fields = [
            "id", "full_name", "register_number", "department", "semester",
            "year", "section", "course", "img_url",
            "attendance_percentage", "subjects"
        ]

    def get_attendance_percentage(self, obj):
        total = obj.attendances.count()
        if total == 0:
            return "0%"
        present = obj.attendances.filter(status="Present").count()
        return f"{(present / total) * 100:.2f}%"

    def get_img_url(self, obj):
        request = self.context.get("request")
        if obj.img and request:
            return request.build_absolute_uri(obj.img.url)
        return None


# -----------------------------
# Teacher Serializer
# -----------------------------
class TeacherSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    subjects = SubjectSerializer(many=True, read_only=True)

    class Meta:
        model = Teacher
        fields = ["id", "user", "department", "subjects"]
class AttendanceSerializer(serializers.ModelSerializer):
    recorded_by = serializers.ReadOnlyField(source="recorded_by.username")
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    semester = serializers.CharField(source="student.semester", read_only=True)
    section = serializers.CharField(source="student.section", read_only=True)

    student = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all())
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all())

    class Meta:
        model = Attendance
        fields = [
            "id",
            "student",
            "student_name",
            "subject",
            "subject_name",
            "date",
            "semester",    
            "section", 
            "session",
            "status",
            "session_id",
            "is_deleted",
            "recorded_by",
            "timestamp",
        ]
        read_only_fields = ["session_id", "recorded_by", "timestamp"]

    # 🔥 THIS IS THE FIX
    def validate(self, attrs):
        student = attrs.get("student")
        subject = attrs.get("subject")
        date = attrs.get("date")
        session = attrs.get("session")

        # Allow multiple periods on same day
        exists = Attendance.objects.filter(
            student=student,
            subject=subject,
            date=date,
            session=session,
            is_deleted=False
        ).exists()

        if exists:
            raise serializers.ValidationError(
                "Attendance already marked for this subject, date and period."
            )

        return attrs
