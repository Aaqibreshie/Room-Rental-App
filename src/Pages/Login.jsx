import "../Styles/Login.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiAlertCircle } from "react-icons/fi";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const response = await res.json();
      console.log("LOGIN RESPONSE:", response);

      if (!response.success) {
        setError(response.message || "Invalid login credentials.");
        return;
      }

      const data = response.data;

      // save token
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("role", data.role?.toLowerCase() || "");

      const role = data.role?.toLowerCase();
      console.log("Extracted role:", role);

      if (role === "tenant") {
        navigate("/");
      } else if (role === "landlord") {
        navigate("/dashboard");
      } else {
        console.log("Unknown role:", role);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="authPage">
      <div className="authBox">
        <h2>Login</h2>
        <p className="authSubtitle">Welcome back</p>

        {/* === INLINE ERROR BOX === */}
        {error && (
          <div className="loginErrorBox">
            <FiAlertCircle className="loginErrorIcon" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="authForm">
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <div className="authInlineRow">
            <button
              className="linkLikeBtn"
              type="button"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot password?
            </button>
          </div>

          <button className="authBtn" type="submit">
            Login
          </button>
        </form>

        <p className="switchText">
          Don’t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
