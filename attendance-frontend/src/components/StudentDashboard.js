import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const StudentDashboard = () => {
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [overall, setOverall] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await API.get("student/profile/");
        const studentData = profileRes.data;
        setStudent(studentData);

        const attendanceRes = await API.get("attendance/");
        const records = attendanceRes.data;

        const myAttendance = records.filter(
          (a) => a.student === studentData.id
        );

        const grouped = {};
        let totalClasses = 0;
        let totalPresent = 0;

        myAttendance.forEach((rec) => {
          const subject = rec.subject_name || rec.subject;
          if (!grouped[subject]) {
            grouped[subject] = { total: 0, present: 0 };
          }
          grouped[subject].total += 1;
          totalClasses += 1;

          if (rec.status === "Present") {
            grouped[subject].present += 1;
            totalPresent += 1;
          }
        });

        const finalData = Object.keys(grouped).map((sub) => {
          const total = grouped[sub].total;
          const present = grouped[sub].present;
          const percentage = Math.round((present / total) * 100);

          return {
            subject: sub,
            total,
            present,
            percentage,
            eligible: percentage >= 75,
          };
        });

        setAttendance(finalData);
        setOverall(
          totalClasses > 0
            ? Math.round((totalPresent / totalClasses) * 100)
            : 0
        );
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
        <p className="text-white text-xl font-black animate-pulse">
          Loading dashboard…
        </p>
      </div>
    );
  }

  const overallEligible = overall >= 75;

  return (
    <>
      {/* 🌈 SMOOTH CHANGING BACKGROUND */}
      <style>{`
        .bg-animate {
          background: linear-gradient(
            -45deg,
            #2563eb,
            #4f46e5,
            #7c3aed,
            #16a34a
          );
          background-size: 400% 400%;
          animation: gradientMove 18s ease-in-out infinite;
        }

        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          25% { background-position: 50% 100%; }
          50% { background-position: 100% 50%; }
          75% { background-position: 50% 0%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <div className="min-h-screen bg-animate p-6 flex justify-center">
        <div className="bg-white/90 backdrop-blur max-w-5xl w-full rounded-3xl shadow-2xl p-8">

          {/* HEADER */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b pb-6 mb-8">
            <h2 className="text-3xl font-black text-gray-800">
              Student Dashboard
            </h2>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl font-bold shadow"
            >
              Logout
            </button>
          </div>

          {/* STUDENT INFO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 text-gray-700 font-medium">
            <Info label="Name" value={student.full_name} />
            <Info label="Register No" value={student.register_number} />
            <Info label="Department" value={student.department} />
            <Info label="Semester" value={student.semester} />
          </div>

          {/* OVERALL */}
          <div
            className={`p-6 rounded-2xl mb-10 text-white shadow-lg ${
              overallEligible ? "bg-green-600" : "bg-red-600"
            }`}
          >
            <h3 className="text-lg font-black uppercase tracking-wide">
              Overall Attendance
            </h3>
            <p className="text-4xl font-black mt-2">{overall}%</p>
            <span className="inline-block mt-3 px-4 py-1 rounded-full text-xs font-black bg-white/20">
              {overallEligible ? "ELIGIBLE ✅" : "NOT ELIGIBLE ❌"}
            </span>
          </div>

          {/* SUBJECT-WISE */}
          <h3 className="text-xl font-black mb-6 text-gray-800">
            Subject-wise Attendance
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {attendance.map((sub, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition"
              >
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-black text-gray-800">{sub.subject}</h4>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black ${
                      sub.eligible
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {sub.eligible ? "Eligible" : "Shortage"}
                  </span>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <p>Total Classes: <b>{sub.total}</b></p>
                  <p>Present: <b>{sub.present}</b></p>
                  <p>
                    Attendance:{" "}
                    <b
                      className={
                        sub.eligible ? "text-green-600" : "text-red-600"
                      }
                    >
                      {sub.percentage}%
                    </b>
                  </p>
                </div>

                {/* ✅ PIE CHART CENTERED */}
                <div className="mt-6 flex justify-center items-center">
                  <div className="w-[220px] h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Present", value: sub.present },
                            { name: "Absent", value: sub.total - sub.present },
                          ]}
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                        >
                          <Cell fill="#22c55e" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
};

const Info = ({ label, value }) => (
  <p className="text-sm uppercase font-black text-gray-500">
    {label}
    <span className="block text-lg text-gray-800 font-bold">{value}</span>
  </p>
);

export default StudentDashboard;
