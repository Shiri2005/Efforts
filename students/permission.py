from rest_framework.permissions import BasePermission

class IsTeacher(BasePermission):
    """Allow access only to teachers (users in 'Teachers' group)."""
    def has_permission(self, request, view):
        return request.user and request.user.groups.filter(name="Teachers").exists()


class IsStudent(BasePermission):
    """Allow access only to students (users in 'Students' group)."""
    def has_permission(self, request, view):
        return request.user and request.user.groups.filter(name="Students").exists()
class IsTeacherOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        return request.user.is_authenticated and request.user.role == 'teacher'