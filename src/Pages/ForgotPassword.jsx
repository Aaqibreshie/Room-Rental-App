import "../Styles/ForgotPassword.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import MiniHeader from "../Components/MiniHeader";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    try {
      setLoading(true);
      const res = await fetch(
        "http://localhost:5000/api/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        setStatus({
          type: "error",
          message: data.message || "Could not send reset email.",
        });
      } else {
        setStatus({
          type: "success",
          message:
            data.message ||
            "If an account exists with this email, we sent an OTP and reset link.",
        });

        // small delay so user sees the message, then go to reset page
        setTimeout(() => {
          navigate("/verify-otp", {
            state: { emailFromForgot: email },
          });
        }, 1200);
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
        title="Forgot password"
        subtitle="Reset access to your account"
      />

      <motion.div
        className="fp-page"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <div className="fp-shell">
          <div className="fp-card">
            <h1>Forgot your password?</h1>
            <p className="fp-sub">
              Enter your email and we’ll send you an OTP and a link to reset
              your password.
            </p>

            {status.message && (
              <div
                className={
                  status.type === "success"
                    ? "fp-alert fp-alert-success"
                    : "fp-alert fp-alert-error"
                }
              >
                {status.type === "success" ? (
                  <FiCheckCircle className="fp-alert-icon" />
                ) : (
                  <FiAlertCircle className="fp-alert-icon" />
                )}
                {status.message}
              </div>
            )}

            <form className="fp-form" onSubmit={handleSubmit}>
              <label>Email address</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <button type="submit" className="fp-submit" disabled={loading}>
                {loading ? "Sending…" : "Send OTP & link"}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </>
  );
}
