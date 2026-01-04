from django.contrib import admin
from .models import Student, Attendance, Teacher, Subject
from django.utils.html import format_html

class SubjectInline(admin.TabularInline):
    model = Subject
    extra = 1
    fields = ('name', 'code', 'department', 'semester','sections')
    show_change_link = True
# -----------------------------
# TEACHER ADMIN
# -----------------------------
@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ("get_name", "get_email", "department", "subjects_count",)
    inlines = [SubjectInline]   # ✅ THIS IS THE FIX

    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    get_name.short_description = "Name"

    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = "Email"

    def subjects_count(self, obj):
        return obj.subjects.count()
    subjects_count.short_description = "Subjects Count"

# -----------------------------
# SUBJECT ADMIN
# -----------------------------
@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "teacher_name", "department", "semester", "students_count" ,"display_sections",)

    def teacher_name(self, obj):
        return obj.teacher.user.get_full_name() if obj.teacher else "-"
    teacher_name.short_description = "Teacher"

    def students_count(self, obj):
        return obj.students.count()
    students_count.short_description = "Students Count"

    def display_sections(self, obj):
        return ", ".join(obj.sections) if obj.sections else "-"

    display_sections.short_description = "Sections"
# -----------------------------
# STUDENT ADMIN
# -----------------------------
@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("get_name", "register_number", "department", "semester", "display_image", "subjects_count","section",)

    def get_name(self, obj):
        return obj.full_name
    get_name.short_description = "Name"

    def display_image(self, obj):
        if obj.img:
            return format_html(
                '<img src="{}" width="40" height="40" style="object-fit:cover;border-radius:4px;" />',
                obj.img.url
            )
        return "-"
    display_image.short_description = "Photo"

    def subjects_count(self, obj):
        return obj.subjects.count()
    subjects_count.short_description = "Subjects Count"

# -----------------------------
# ATTENDANCE ADMIN
# -----------------------------
@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ("student_image", "student_name", "date", "status", "subject_name", "recorded_by_email", "timestamp", "attendance_percentage")

    def student_image(self, obj):
        if obj.student.img:
            return format_html(
                '<img src="{}" width="50" height="50" style="border-radius:50%;object-fit:cover;" />', 
                obj.student.img.url
            )
        return "-"
    student_image.short_description = "Profile Pic"

    def student_name(self, obj):
        return obj.student.full_name
    student_name.short_description = "Student"

    def subject_name(self, obj):
        return obj.subject.name
    subject_name.short_description = "Subject"

    def recorded_by_email(self, obj):
        return obj.recorded_by.email
    recorded_by_email.short_description = "Recorded By"

    def attendance_percentage(self, obj):
        total = obj.student.attendances.count()
        if total == 0:
            return "0%"
        present = obj.student.attendances.filter(status="Present").count()
        return f"{(present / total) * 100:.2f}%"
    attendance_percentage.short_description = "Attendance %"
