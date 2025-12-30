import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import MiniHeader from "../Components/MiniHeader";
import "../Styles/VerifyOtp.css";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = location.state?.emailFromForgot || "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    if (!email || !otp) {
      setStatus({ type: "error", message: "Please enter email and OTP." });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        "http://localhost:5000/api/auth/verify-reset-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        }
      );

      const data = await res.json();
      if (!data.success) {
        setStatus({
          type: "error",
          message: data.message || "Invalid or expired OTP.",
        });
      } else {
        setStatus({
          type: "success",
          message: data.message || "OTP verified successfully.",
        });

        const resetToken = data.data?.resetToken;

        if (resetToken) {
          setTimeout(() => {
            navigate(`/reset-password/${resetToken}`, {
              state: { verifiedEmail: email },
            });
          }, 1000);
        }
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
      <MiniHeader
        title="Verify OTP"
        subtitle="Confirm the code sent to your email"
      />

      <motion.div
        className="vo-page"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <div className="vo-shell">
          <div className="vo-card">
            <h1>Enter verification code</h1>
            <p className="vo-sub">
              We sent a 6-digit OTP to your email. Enter it below to continue.
            </p>

            {status.message && (
              <div
                className={
                  status.type === "success"
                    ? "vo-alert vo-alert-success"
                    : "vo-alert vo-alert-error"
                }
              >
                {status.type === "success" ? (
                  <FiCheckCircle className="vo-alert-icon" />
                ) : (
                  <FiAlertCircle className="vo-alert-icon" />
                )}
                {status.message}
              </div>
            )}

            <form className="vo-form" onSubmit={handleSubmit}>
              <label>Email</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label>OTP code</label>
              <input
                type="text"
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />

              <button type="submit" className="vo-submit" disabled={loading}>
                {loading ? "Verifying…" : "Verify OTP"}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </>
  );
}
