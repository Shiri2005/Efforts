import React, { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await API.post("token/", { username, password });

      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);
      localStorage.setItem("is_staff", String(res.data.is_staff));

      if (res.data.must_change_password) {
        navigate("/change-password");
      } else if (res.data.is_staff) {
        navigate("/teacher/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    } catch (err) {
      setError("Invalid credentials");
    }
  };

  return (
    <>
      {/* 🔥 INLINE CSS FROM FIGMA/HTML */}
      <style>{`
        body {
          margin: 0;

        }
        .login-bg {
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: 'Segoe UI', sans-serif;
          background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab, #ff9a9e, #fad0c4);
          background-size: 400% 400%;
          animation: gradientBG 15s ease infinite;
        }

        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .login-card {
          background: white;
          padding: 50px 40px;
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          width: 100%;
          max-width: 380px;
          text-align: center;
          animation: float 4s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }

        .logo-box {
          background: linear-gradient(135deg, #6e8efb, #a777e3);
          width: 70px;
          height: 70px;
          margin: 0 auto 20px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-box svg {
          width: 40px;
          fill: white;
        }

        h2 {
          margin: 10px 0 5px;
          color: #333;
          font-weight: 700;
        }

        p {
          color: #777;
          font-size: 14px;
          margin-bottom: 30px;
        }

        .input-group {
          text-align: left;
          margin-bottom: 20px;
        }

        label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          color: #444;
        }

        input {
          width: 100%;
          padding: 12px 15px;
          border: 1px solid #eee;
          border-radius: 12px;
          font-size: 14px;
          outline: none;
        }

        input:focus {
          border-color: #a777e3;
        }

        .sign-in-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(90deg, #4facfe 0%, #a777e3 100%);
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }

        .error-text {
          color: red;
          font-size: 13px;
          margin-top: 12px;
        }
      `}</style>

      <div className="login-bg">
        <div className="login-card">
          <div className="logo-box">
            <svg viewBox="0 0 24 24">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
            </svg>
          </div>

          <h2>Attendance Tracker</h2>
          <p>Sign in to continue</p>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />

            </div>
            <p className="text-sm text-center mt-3 text-gray-600">
  Forgot password?
  <span className="text-blue-600 font-bold ml-1">
    Contact Admin
  </span>
</p>

            <button className="sign-in-btn" type="submit">
              Sign In
            </button>

            {error && <div className="error-text">{error}</div>}
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
