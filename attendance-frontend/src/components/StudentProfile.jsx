import React, { useEffect, useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

const StudentProfile = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get("student/profile/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        setStudent(res.data);
      } catch (err) {
        console.error("Error fetching student profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("is_staff");
    localStorage.removeItem("username");
    navigate("/");
  };

  if (loading)
    return <p className="text-center mt-10 text-gray-500">Loading...</p>;

  if (!student)
    return <p className="text-center mt-10 text-red-500">No student data found.</p>;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
          Student Profile
        </h2>

        <div className="space-y-3 text-gray-700">
          <p><span className="font-medium">Full Name:</span> {student.full_name}</p>
          <p><span className="font-medium">Username:</span> {student.username}</p>
          <p><span className="font-medium">Email:</span> {student.email}</p>
          <p><span className="font-medium">Roll No:</span> {student.register_number}</p>
          <p><span className="font-medium">Department:</span> {student.department}</p>
          <p><span className="font-medium">Semester:</span> {student.semester}</p>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={() => navigate("/student/dashboard")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full"
          >
            Back to Dashboard
          </button>

          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition w-full"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
