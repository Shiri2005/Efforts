import React, { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

const UploadStudents = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const authHeader = () => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select an Excel file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await API.post("/upload-students/", formData, {
        headers: {
          ...authHeader(),
          "Content-Type": "multipart/form-data",
        },
      });
      setMessage(`Success! ${res.data.created_students} students uploaded.`);
      setFile(null);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Upload failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Upload Students (Excel)
        </h2>

        {message && (
          <p className="mb-4 text-center text-red-500">{message}</p>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="w-full border p-2 rounded"
          />

          <button
            type="submit"
            className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700 transition"
          >
            Upload
          </button>

          <button
            type="button"
            onClick={() => navigate("/teacher/dashboard")}
            className="bg-gray-300 text-black w-full py-2 rounded hover:bg-gray-400 transition"
          >
            Back to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadStudents;
