import React, { useEffect, useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function TeacherProfile() {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Authorization header helper
  const authHeader = () => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch 
  // profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get("/teacher/profile/", { headers: authHeader() });
        setTeacher(res.data);
      } catch (err) {
        console.error("Error fetching teacher profile:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-600">Loading teacher profile...</p>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <p className="text-red-500 text-lg mb-4">Profile not found or failed to load.</p>
        <button
          onClick={() => navigate("/teacher/dashboard")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-96 text-center border border-gray-200">
        <img
          src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
          alt="Teacher Avatar"
          className="w-24 h-24 rounded-full mx-auto mb-4 shadow-md"
        />
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Teacher Profile</h1>

        <div className="text-left space-y-3">
          <p><strong className="text-gray-700">Full Name:</strong> {teacher.full_name || "N/A"}</p>
          <p><strong className="text-gray-700">Email:</strong> {teacher.email || "N/A"}</p>
          <p><strong className="text-gray-700">Department:</strong> {teacher.department || "N/A"}</p>
          <p><strong className="text-gray-700">Subject:</strong> {teacher.subjects || "Not Assigned"}</p>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={() => navigate("/teacher/dashboard")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
