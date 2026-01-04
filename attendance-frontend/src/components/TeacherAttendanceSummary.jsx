import React, { useEffect, useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import { Search, ArrowLeft, Clock } from "lucide-react";

const TeacherAttendanceSummary = () => {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState(null);
  const [sessionDetails, setSessionDetails] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);

  const navigate = useNavigate();

  // ---------------- FETCH ATTENDANCE ----------------
  const fetchAttendance = async (deleted = false) => {
    setLoading(true);
    try {
      const url = deleted
        ? "/attendance/teacher-deleted/"
        : "/attendance/teacher-summary/";
      const res = await API.get(url);
      setSessions(res.data);
      setFilteredSessions(res.data);
    } catch {
      alert("Failed to load summary");
    } finally {
      setTimeout(() => setLoading(false), 400); // ✨ smooth loading
    }
  };

  useEffect(() => {
    fetchAttendance(showDeleted);
  }, [showDeleted]);

  // ---------------- FILTER ----------------
  useEffect(() => {
    const results = sessions.filter(
      (s) =>
        s.subject__name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.date.includes(searchTerm) ||
        s.session.toString().includes(searchTerm)
    );
    setFilteredSessions(results);
  }, [searchTerm, sessions]);

  // ---------------- VIEW DETAILS ----------------
  const viewDetails = async (sessionId) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
      return;
    }
    try {
      const res = await API.get(`/attendance/by-session/${sessionId}/`);
      setSessionDetails(res.data);
      setExpandedSession(sessionId);
    } catch {
      alert("Failed to load student list");
    }
  };

  // ---------------- DELETE ----------------
  const deleteSession = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this session?")) return;
    await API.delete(`/attendance/delete-session/${id}/`);
    fetchAttendance(showDeleted);
  };

  // ---------------- RESTORE ----------------
  const restoreSession = async (e, id) => {
    e.stopPropagation();
    await API.post(`/attendance/restore-session/${id}/`);
    fetchAttendance(showDeleted);
  };

  return (
    <>
      {/* 🌈 animated background */}
      <style>{`
        .bg-animate {
          background: linear-gradient(-45deg, #667eea, #764ba2, #3b82f6, #6ee7b7);
          background-size: 400% 400%;
          animation: gradient 14s ease infinite;
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <div className="min-h-screen bg-animate p-4 md:p-6">
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">

          {/* HEADER */}
          <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-gray-800">Attendance History</h2>
              <p className="text-sm text-gray-500">Review & manage sessions</p>
            </div>
            <button
              onClick={() => navigate("/teacher/dashboard")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-xl text-white font-bold shadow transition active:scale-95"
            >
              <ArrowLeft size={18} /> Dashboard
            </button>
          </div>

          {/* TABS */}
          <div className="flex gap-2">
            <Tab active={!showDeleted} onClick={() => setShowDeleted(false)}>
              Active
            </Tab>
            <Tab active={showDeleted} danger onClick={() => setShowDeleted(true)}>
              Deleted
            </Tab>
          </div>

          {/* SEARCH */}
          <div className="relative">
            <input
              className="w-full p-4 pl-12 rounded-2xl shadow focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              placeholder="Search subject, date or period..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-4 text-gray-400" />
          </div>

          {/* LOADING */}
          {loading && (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          )}

          {/* LIST */}
          {!loading && (
            <div className="space-y-4">
              {filteredSessions.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow">
                  <p className="font-bold text-gray-500">No records found</p>
                </div>
              ) : (
                filteredSessions.map((s, i) => (
                  <div
                    key={`${s.session_id}-${i}`}
                    className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden"
                  >
                    <div
                      onClick={() => viewDetails(s.session_id)}
                      className="p-5 flex flex-col md:flex-row justify-between items-center gap-4 cursor-pointer"
                    >
                      <div className="flex-1">
                        <p className="text-xs text-blue-600 font-black uppercase">
                          {s.subject__name}
                        </p>
                        <div className="flex gap-3 items-center">
                          <p className="text-xs text-gray-500 font-bold">
                               Sem {s.student__semester} • Section {s.student__section}
                          </p>

                          <span className="font-bold">📅 {s.date}</span>
                          <span className="flex items-center gap-1 text-xs font-black bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            <Clock size={12} /> Period {s.session}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-6">
                        <Stat label="Total" value={s.total} />
                        <Stat label="Present" value={s.present} green />
                        <Stat label="Absent" value={s.absent} red />
                      </div>

                      <div className="flex gap-2">
                        {showDeleted ? (
                          <MiniBtn green onClick={(e) => restoreSession(e, s.session_id)}>
                            Undo
                          </MiniBtn>
                        ) : (
                          <MiniBtn red onClick={(e) => deleteSession(e, s.session_id)}>
                            Delete
                          </MiniBtn>
                        )}
                        <MiniBtn>
                          {expandedSession === s.session_id ? "Close ▲" : "View ▼"}
                        </MiniBtn>
                      </div>
                    </div>

                    {expandedSession === s.session_id && (
                      <div className="bg-gray-50 p-6 border-t animate-in fade-in slide-in-from-top-2">
                        <table className="w-full">
                          <thead>
                            <tr className="text-xs uppercase text-gray-400 font-black border-b">
                              <th className="pb-3 text-left">Student</th>
                              <th className="pb-3 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sessionDetails.map((st, idx) => (
                              <tr key={idx} className="hover:bg-white transition">
                                <td className="py-3 font-bold">{st.student_name}</td>
                                <td className="py-3 text-right">
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-black ${
                                      st.status === "Present"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {st.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/* ---------- UI helpers ---------- */

const Tab = ({ children, active, danger, onClick }) => (
  <button
    onClick={onClick}
    className={`px-5 py-2 rounded-xl font-black transition ${
      active
        ? danger
          ? "bg-red-600 text-white"
          : "bg-blue-600 text-white"
        : "bg-white text-gray-600"
    }`}
  >
    {children}
  </button>
);

const Stat = ({ label, value, green, red }) => (
  <div className="text-center">
    <p className="text-[10px] uppercase font-black text-gray-400">{label}</p>
    <p
      className={`font-bold ${
        green ? "text-green-600" : red ? "text-red-600" : "text-gray-700"
      }`}
    >
      {value}
    </p>
  </div>
);

const MiniBtn = ({ children, onClick, red, green }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase transition ${
      red
        ? "text-red-600 hover:bg-red-50"
        : green
        ? "text-green-600 hover:bg-green-50"
        : "text-gray-700 bg-gray-100 hover:bg-gray-200"
    }`}
  >
    {children}
  </button>
);

export default TeacherAttendanceSummary;
