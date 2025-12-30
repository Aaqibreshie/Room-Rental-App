import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiChevronDown,
  FiAlertCircle,
} from "react-icons/fi";
import "../Styles/Register.css";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "tenant",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed");
        setLoading(false);
        return;
      }

      navigate("/login");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authContainer premium-bg">
      <div className="authCard premium-card">
        <h2>Create Your Account</h2>
        <p className="authSubtitle">
          Join Roomify — find rooms easily & securely
        </p>

        {/* ERROR BOX WITH ICON */}
        {error && (
          <div className="authError premium-error">
            <FiAlertCircle className="errorIcon" />
            {error}
          </div>
        )}

        <form className="authFormModern" onSubmit={handleSubmit}>
          <div className="inputGroup iconInput">
            <FiUser className="inputIcon" />
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Full Name"
              required
            />
          </div>

          <div className="inputGroup iconInput">
            <FiMail className="inputIcon" />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email Address"
              required
            />
          </div>

          <div className="inputGroup iconInput">
            <FiPhone className="inputIcon" />
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              required
            />
          </div>

          <div className="inputGroup iconInput">
            <FiLock className="inputIcon" />
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              required
            />
          </div>

          <div className="inputGroup iconInput selectInput">
            <FiChevronDown className="selectIcon" />
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="tenant">Tenant</option>
              <option value="landlord">Landlord</option>
            </select>
          </div>

          <button className="authPrimaryBtn premium-btn" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="authSwitch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
