import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";

const MarkAttendance = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("Present");
  const [session, setSession] = useState(1);
  const [loading, setLoading] = useState(false);

  // 1. Load data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teacherRes, studentRes] = await Promise.all([
          API.get("/teacher/profile/"),
          API.get(`/students/${studentId}/`)
        ]);
        setTeacher(teacherRes.data);
        setStudent(studentRes.data);
      } catch (err) {
        console.error("Initialization error:", err);
        alert("Failed to load student or teacher data.");
      }
    };

    fetchData();
    setDate(new Date().toISOString().split("T")[0]);
  }, [studentId]);

  const handleSubmit = async () => {
    const subject = teacher?.subjects?.[0];
    if (!subject) return alert("No subject assigned to teacher!");

    // Construct payload matching your AttendanceSerializer
    const payload = {
      student: parseInt(studentId),
      subject: subject.id,
      date: date,
      status: status,
      session: session, // This prevents the 'unique_together' 400 error
    };

    try {
      setLoading(true);
      await API.post("/attendance/", payload);
      alert(`Attendance marked for ${student.full_name} (Session ${session})! ✅`);
      navigate("/teacher-dashboard"); // Match your route name
    } catch (err) {
      console.error("Submit error:", err);
      // Display specific error from Django (e.g., "Already marked")
      const errorDetail = err.response?.data 
        ? JSON.stringify(err.response.data) 
        : "Network error";
      alert("Error: " + errorDetail);
    } finally {
      setLoading(false);
    }
  };

  if (!student || !teacher) return <h2 style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</h2>;

  return (
    <div style={{ maxWidth: "500px", margin: "40px auto", padding: "20px", border: "1px solid #ddd", borderRadius: "10px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
      <h2 style={{ borderBottom: "2px solid #007bff", pb: "10px" }}>Mark Attendance</h2>

      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ margin: "5px 0" }}>{student.full_name}</h3>
        <p style={{ color: "#666" }}>Register Number: <strong>{student.register_number}</strong></p>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label><strong>Select Date:</strong></label><br />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ width: "100%", padding: "10px", marginTop: "5px", borderRadius: "5px", border: "1px solid #ccc" }}
        />
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label><strong>Session / Period:</strong></label><br />
        <select
          value={session}
          onChange={(e) => setSession(Number(e.target.value))}
          style={{ width: "100%", padding: "10px", marginTop: "5px", borderRadius: "5px", border: "1px solid #ccc" }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
            <option key={num} value={num}>Period {num}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button
          onClick={() => setStatus("Present")}
          style={{
            flex: 1, padding: "12px", borderRadius: "5px", border: "none", cursor: "pointer",
            backgroundColor: status === "Present" ? "#28a745" : "#c3e6cb",
            color: "white", fontWeight: "bold"
          }}
        >
          Present
        </button>

        <button
          onClick={() => setStatus("Absent")}
          style={{
            flex: 1, padding: "12px", borderRadius: "5px", border: "none", cursor: "pointer",
            backgroundColor: status === "Absent" ? "#dc3545" : "#f5c6cb",
            color: "white", fontWeight: "bold"
          }}
        >
          Absent
        </button>
      </div>

      <div style={{ marginTop: "30px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            padding: "15px", background: loading ? "#ccc" : "#007bff",
            color: "white", border: "none", borderRadius: "5px", fontWeight: "bold", cursor: "pointer"
          }}
        >
          {loading ? "Saving..." : "Submit Attendance"}
        </button>

        <button
          onClick={() => navigate("/teacher-dashboard")}
          style={{ padding: "10px", background: "transparent", border: "1px solid #6c757d", borderRadius: "5px", cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default MarkAttendance;