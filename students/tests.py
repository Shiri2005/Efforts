from django.test import TestCase
from django.contrib.auth.models import User
from .models import Student, Attendance

class AttendancePercentageTests(TestCase):
    def setUp(self):
        u = User.objects.create_user('s1', 's1@example.com', 'pass')
        self.student = Student.objects.create(user=u)

    def test_no_attendance_records(self):
        self.assertEqual(self.student.attendance_percentage(), 0)

    def test_all_present(self):
        Attendance.objects.create(student=self.student, date='2025-10-01', status='present')
        Attendance.objects.create(student=self.student, date='2025-10-02', status='present')
        self.assertEqual(self.student.attendance_percentage(), 100)

    def test_mixed_attendance(self):
        Attendance.objects.create(student=self.student, date='2025-10-01', status='present')
        Attendance.objects.create(student=self.student, date='2025-10-02', status='absent')
        self.assertEqual(self.student.attendance_percentage(), 50)
