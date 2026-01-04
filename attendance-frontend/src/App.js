import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Components
import Login from "./components/login";
import StudentDashboard from "./components/StudentDashboard";
import StudentProfile from "./components/StudentProfile";
import TeacherDashboard from "./components/TeacherDashboard";
import TeacherProfile from "./components/TeacherProfile";
import UploadStudents from "./components/student_upload_template";
import ChangePassword from "./components/ChangePassword";
import TeacherAttendanceSummary from "./components/TeacherAttendanceSummary";

// Auth utils
import { isAuthenticated, isTeacher } from "./utils/auth"; 

// ---------------- PROTECTED ROUTES ----------------
const StudentRoute = ({ children }) => {
  if (!isAuthenticated()) return <Navigate to="/" replace />;
  return !isTeacher() ? children : <Navigate to="/teacher/dashboard" replace />;
};

const TeacherRoute = ({ children }) => {
  if (!isAuthenticated()) return <Navigate to="/" replace />;
  return isTeacher() ? children : <Navigate to="/student/dashboard" replace />;
};

function App() {
  return (
    <Routes>
      {/* LOGIN */}
      <Route path="/" element={<Login />} />

      {/* CHANGE PASSWORD */}
      <Route path="/change-password" element={<ChangePassword />} />

      {/* STUDENT ROUTES */}
      <Route
        path="/student/dashboard"
        element={
          <StudentRoute>
            <StudentDashboard />
          </StudentRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <StudentRoute>
            <StudentProfile />
          </StudentRoute>
        }
      />

      {/* TEACHER ROUTES */}
      <Route
        path="/teacher/dashboard"
        element={
          <TeacherRoute>
            <TeacherDashboard />
          </TeacherRoute>
        }
      />
      <Route
        path="/teacher/profile"
        element={
          <TeacherRoute>
            <TeacherProfile />
          </TeacherRoute>
        }
      />
      <Route
        path="/upload-students"
        element={
          <TeacherRoute>
            <UploadStudents />
          </TeacherRoute>
        }
      />
      <Route
        path="/teacher/attendance-summary"
        element={
          <TeacherRoute>
            <TeacherAttendanceSummary />
          </TeacherRoute>
        }
      />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
