import React, { useEffect, useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

const TeacherDashboard = () => {
  const [teacher, setTeacher] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentStatus, setStudentStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(1);
  const [section, setSection] = useState("");
  const [semester, setSemester] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const navigate = useNavigate();

  // ---------------- FETCH TEACHER PROFILE ----------------
  const fetchProfile = async () => {
    try {
      const res = await API.get("/teacher/profile/");
      setTeacher(res.data);
        if (res.data.subjects.length > 0) {
         setSelectedSubject(res.data.subjects[0].id);
    }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/");
      }
    }
  };

  const fetchStudents = async () => {
  if (!semester || !section || !selectedSubject) {
    setStudents([]);
    setStudentStatus({});
    return;
  }

  try {
    const res = await API.get(
      `/teacher/students/?subject=${selectedSubject}&semester=${semester}&section=${section}`
    );

    setStudents(res.data);

    const initialStatus = {};
    res.data.forEach((s) => (initialStatus[s.id] = ""));
    setStudentStatus(initialStatus);
  } catch (err) {
    console.error("Failed to fetch students", err);
    setStudents([]);
    setStudentStatus({});
  }
};


  // ---------------- ADD ATTENDANCE ----------------
  const addAttendance = async (e) => {
  e.preventDefault();

  if (!selectedSubject || !semester || !section) {
    alert("Select subject, semester and section");
    return;
  }

  const unmarked = students.filter((s) => !studentStatus[s.id]);
  if (unmarked.length > 0) {
    alert(`Mark all students (${unmarked.length} left)`);
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  const data = students.map((s) => ({
    student: s.id,
    subject: selectedSubject,
    date: today,
    session: period,
    semester,
    section,
    status: studentStatus[s.id],
  }));

  try {
    setLoading(true);
    await API.post("/attendance/", data);
    alert("Attendance marked ✅");
    navigate("/teacher/attendance-summary");
  } catch (err) {
    alert("Already marked  for this period ");
  } finally {
    setLoading(false);
  }
};


  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  useEffect(() => {
    const load = async () => {
      await fetchProfile();
      setLoading(false);
    };
    load();
  }, []);
  useEffect(() => {
  if (semester && section && selectedSubject) {
    fetchStudents();
  }
}, [semester, section,selectedSubject]);


  if (loading) {
    return <p className="text-center mt-10 font-bold text-white">Loading…</p>;
  }

 

  const subjectObj = teacher?.subjects?.find(
  (s) => s.id === Number(selectedSubject)
);

  return (
    <>
      {/* 🌈 Animated background */}
      <style>{`
        .bg-animate {
          background: linear-gradient(-45deg, #667eea, #764ba2, #6ee7b7, #3b82f6);
          background-size: 400% 400%;
          animation: gradient 12s ease infinite;
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <div className="min-h-screen bg-animate p-6">
        {/* TOP BAR */}
        <div className="max-w-5xl mx-auto flex justify-between items-center mb-6">
          <h1 className="text-white text-2xl font-black">Teacher Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-5 py-2 rounded-xl text-white font-bold shadow"
          >
            Logout
          </button>
        </div>

        <div className="max-w-5xl mx-auto space-y-6">
          {/* PROFILE */}
          <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow">
            <div className="grid md:grid-cols-3 gap-4">
              <Info label="Username" value={teacher?.user?.username} />
              <Info label="Department" value={teacher?.department} />
              <Info label="Subject" value={subjectObj?.name || "Not assigned"} highlight />
            </div>

            <div className="flex gap-4 mt-6">
              <Action onClick={() => navigate("/upload-students")} color="green">
                Upload Students
              </Action>
              <Action onClick={() => navigate("/teacher/attendance-summary")} color="blue">
                History
              </Action>
            </div>
          </div>

          {/* PERIOD */}
          <div className="bg-white/90 backdrop-blur p-5 rounded-2xl shadow flex justify-between">
            <span className="font-black text-gray-700 uppercase text-sm">
              Active Period
            </span>
            <select
              value={period}
              onChange={(e) => setPeriod(+e.target.value)}
              className="px-4 py-2 rounded-xl font-bold border focus:ring-2 focus:ring-blue-500"
            >
              {[1,2,3,4,5,6,7,8].map(p => (
                <option key={p} value={p}>Period {p}</option>
              ))}
            </select>
          </div>{/* SEMESTER & SECTION */}
<div className="bg-white/90 backdrop-blur p-5 rounded-2xl shadow flex flex-col md:flex-row gap-4 justify-between items-center">
  <div className="flex flex-col">
  <label className="text-xs font-black text-gray-600 uppercase">
    Subject
  </label>
  <select
    value={selectedSubject}
    onChange={(e) => setSelectedSubject(e.target.value)}
    className="px-4 py-2 rounded-xl border font-bold"
  >
    <option value="">Select Subject</option>
    {teacher?.subjects?.map((s) => (
      <option key={s.id} value={s.id}>{s.name}</option>
    ))}
  </select>
</div>

  <div className="flex flex-col">
    <label className="text-xs font-black text-gray-600 uppercase">
      Semester
    </label>
    <select
      value={semester}
      onChange={(e) => setSemester(e.target.value)}
      className="px-4 py-2 rounded-xl border font-bold"
    >
      <option value="">Select Semester</option>
      {["I","II","III","IV","V","VI"].map((s) => (
      <option key={s} value={s}>Semester {s}</option>
     ))}

    </select>
  </div>

  <div className="flex flex-col">
    <label className="text-xs font-black text-gray-600 uppercase">
      Section
    </label>
    <select
      value={section}
      onChange={(e) => setSection(e.target.value)}
      className="px-4 py-2 rounded-xl border font-bold"
    >
      <option value="">Select Section</option>
      {["A","B","C","D"].map((sec) => (
        <option key={sec} value={sec}>Section {sec}</option>
      ))}
    </select>
  </div>
</div>


          {/* ATTENDANCE */}
          <form onSubmit={addAttendance} className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b font-black">
              Roll Call — Period {period}
            </div>

            <div className="max-h-[65vh] overflow-y-auto divide-y">
              {students.map((s) => (
                <div key={s.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold">{s.full_name}</p>
                    <p className="text-xs text-gray-400">{s.register_number}</p>
                  </div>

                  {/* ✅ CLEAN PILL BUTTONS */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setStudentStatus((prev) => ({ ...prev, [s.id]: "Present" }))
                      }
                      className={`px-4 py-2 rounded-full text-xs font-black transition
                        ${
                          studentStatus[s.id] === "Present"
                            ? "bg-green-600 text-white shadow"
                            : "border border-green-600 text-green-600 hover:bg-green-50"
                        }`}
                    >
                      Present
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setStudentStatus((prev) => ({ ...prev, [s.id]: "Absent" }))
                      }
                      className={`px-4 py-2 rounded-full text-xs font-black transition
                        ${
                          studentStatus[s.id] === "Absent"
                            ? "bg-red-600 text-white shadow"
                            : "border border-red-600 text-red-600 hover:bg-red-50"
                        }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-gray-50 border-t">
              <button
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-black text-lg shadow"
              >
                {loading ? "Saving…" : `Submit Attendance`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

/* ---- small UI helpers ---- */
const Info = ({ label, value, highlight }) => (
  <p className="text-xs uppercase font-black text-gray-500">
    {label}
    <span className={`block text-lg ${highlight ? "text-blue-600" : "text-gray-900"}`}>
      {value}
    </span>
  </p>
);

const Action = ({ children, onClick, color }) => (
  <button
    onClick={onClick}
    className={`px-6 py-2 rounded-xl text-white font-bold shadow bg-${color}-600 hover:bg-${color}-700`}
  >
    {children}
  </button>
);

export default TeacherDashboard;
