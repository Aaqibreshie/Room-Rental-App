import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import MiniHeader from "../Components/MiniHeader";
import "../Styles/ResetPassword.css";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    if (!form.password || !form.confirmPassword) {
      setStatus({ type: "error", message: "Please fill all fields." });
      return;
    }
    if (form.password !== form.confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match." });
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `http://localhost:5000/api/auth/reset-password/${token}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: form.password,
            confirmPassword: form.confirmPassword,
          }),
        }
      );
      const data = await res.json();

      if (!data.success) {
        setStatus({
          type: "error",
          message: data.message || "Could not reset password.",
        });
      } else {
        setStatus({
          type: "success",
          message: data.message || "Password reset successfully.",
        });
        setTimeout(() => navigate("/"), 2200);
      }
    } catch {
      setStatus({
        type: "error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <MiniHeader title="Reset password" subtitle="Set a new password" />

      <motion.div
        className="rp-page"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <div className="rp-shell">
          <div className="rp-card">
            <h1>Reset your password</h1>
            <p className="rp-sub">
              Choose a strong password you haven't used before.
            </p>

            {status.message && (
              <div
                className={
                  status.type === "success"
                    ? "rp-alert rp-alert-success"
                    : "rp-alert rp-alert-error"
                }
              >
                {status.type === "success" ? (
                  <FiCheckCircle className="rp-alert-icon" />
                ) : (
                  <FiAlertCircle className="rp-alert-icon" />
                )}
                {status.message}
              </div>
            )}

            <form className="rp-form" onSubmit={handleSubmit}>
              <label>New password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />

              <label>Confirm new password</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />

              <button type="submit" className="rp-submit" disabled={loading}>
                {loading ? "Updating…" : "Reset password"}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </>
  );
}
