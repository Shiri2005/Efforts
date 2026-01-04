from django.db import models
from django.contrib.auth.models import User
import datetime
import uuid
# -----------------------------
# TEACHER MODEL
# -----------------------------
class Teacher(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    department = models.CharField(max_length=100, blank=True, null=True)


    def __str__(self):
        # Use full_name if available, otherwise username
        return self.user.get_full_name() or self.user.username


# -----------------------------
# SUBJECT MODEL
# -----------------------------
class Subject(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)
    sections = models.JSONField(default=list) 
    teacher = models.ForeignKey(
        Teacher,
        on_delete=models.SET_NULL,
        related_name='subjects',
        null=True,
        blank=True
    )
    department = models.CharField(max_length=50, blank=True, null=True)
    semester = models.CharField(max_length=10, blank=True, null=True)

    def __str__(self):
      
      if self.teacher and self.teacher.user:
        name = self.teacher.user.get_full_name()
        return f"{self.name} - {name if name.strip() else self.teacher.user.username}"
      return f"{self.name} - No Teacher"


# -----------------------------
# STUDENT MODEL
# -----------------------------
class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    
    # Personal details
    full_name = models.CharField(max_length=100)
    register_number = models.CharField(max_length=100, unique=True)
    roll_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    img = models.ImageField(upload_to='student_images/', blank=True, null=True)
    
    # Academic details
    department = models.CharField(max_length=50)
    semester = models.CharField(max_length=10)
    year = models.CharField(max_length=10, null=True, blank=True)
    section = models.CharField(
        max_length=2,
        choices=[("A","A"),("B","B"),("C","C"),("D","D")]
    )
    course = models.CharField(max_length=100, null=True, blank=True)
    must_change_password = models.BooleanField(default=True)

    # Relationship with subjects
    subjects = models.ManyToManyField(Subject, related_name='students')

    def attendance_percentage(self):
        total = self.attendances.count()
        present = self.attendances.filter(status='Present').count()
        return round((present / total) * 100, 2) if total else 0

    def __str__(self):
        return f"{self.full_name} ({self.register_number})"

# -----------------------------
# ATTENDANCE MODEL
# -----------------------------
class Attendance(models.Model):
    STATUS_CHOICES = (
        ("Present", "Present"),
        ("Absent", "Absent"),
    )

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="attendances"
    )
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)

    date = models.DateField(default=datetime.date.today)

    # 🔥 NEW: Period / Hour
    session = models.PositiveIntegerField(default=1)

    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    recorded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    semester = models.CharField(max_length=10)   # ✅ NEW
    section = models.CharField(max_length=5)  
    session_id = models.UUIDField(default=uuid.uuid4, editable=False)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["student", "date", "subject", "session"],
                condition=models.Q(is_deleted=False),
                name="unique_attendance_per_period"
            )
        ]
        ordering = ["-date", "session", "student"]
