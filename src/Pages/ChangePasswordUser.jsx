import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MiniHeader from "../Components/MiniHeader";
import Toast from "../Components/Toast";
import "../Styles/ChangePasswordUser.css";

export default function ChangePassword() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setToast({
        show: true,
        message: "Please fill all fields",
        type: "error",
      });
      hideToast();
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setToast({
        show: true,
        message: "New passwords do not match",
        type: "error",
      });
      hideToast();
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        "http://localhost:5000/api/auth/change-password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: form.currentPassword,
            newPassword: form.newPassword,
            confirmPassword: form.confirmPassword,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setToast({
          show: true,
          message: "Password updated successfully",
          type: "success",
        });
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        hideToast(() => navigate("/profile"));
      } else {
        setToast({
          show: true,
          message: data.message || "Failed to update password",
          type: "error",
        });
        hideToast();
      }
    } catch {
      setToast({ show: true, message: "Something went wrong", type: "error" });
      hideToast();
    } finally {
      setLoading(false);
    }
  }

  function hideToast(cb) {
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
      if (cb) cb();
    }, 2200);
  }

  return (
    <>
      <MiniHeader title="Change password" subtitle="Keep your account secure" />

      <motion.div
        className="cp-page"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <div className="cp-shell">
          <div className="cp-card">
            <h1>Update your password</h1>
            <p className="cp-sub">
              Enter your current password and choose a strong new one.
            </p>

            <form className="cp-form" onSubmit={handleSubmit}>
              <div className="cp-field">
                <label>Current password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
              </div>

              <div className="cp-field">
                <label>New password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
              </div>

              <div className="cp-field">
                <label>Confirm new password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
              </div>

              <button className="cp-submit" type="submit" disabled={loading}>
                {loading ? "Updating…" : "Save password"}
              </button>
            </form>
          </div>
        </div>
      </motion.div>

      <Toast show={toast.show} message={toast.message} />
    </>
  );
}
