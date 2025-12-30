import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Toast from "../Components/Toast";
import "../Styles/ProfilePage.css";
import { useNavigate } from "react-router-dom";
import MiniHeader from "../Components/MiniHeader";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "" });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    bio: "",
    address: "",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setUser(data.data);
        setForm({
          fullName: data.data.fullName || "",
          bio: data.data.bio || "",
          address: data.data.address?.city || "",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function saveProfile() {
    try {
      const formData = new FormData();
      formData.append("fullName", form.fullName);
      formData.append("bio", form.bio);
      formData.append("address", form.address);

      if (avatarFile) {
        formData.append("image", avatarFile);
      }

      const res = await fetch("http://localhost:5000/api/auth/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setToast({ show: true, message: "Profile updated successfully" });
        setAvatarFile(null);
        fetchProfile();
      }
    } catch {
      setToast({ show: true, message: "Failed to update profile" });
    }

    setTimeout(() => setToast({ show: false, message: "" }), 2500);
  }

  function goToChangePassword() {
    navigate("/change-password");
  }

  if (loading) return <div className="profile-loading">Loading profile…</div>;
  if (!user) return <div className="profile-loading">Profile not found</div>;

  return (
    <>
      <MiniHeader title="My Profile" />
      <motion.div
        className="profile-page"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="profile-container">
          {/* Premium Hero */}
          <motion.div
            className="profile-hero"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="profile-avatar-section">
              <div className="profile-avatar-container">
                <label className="profile-avatar-label">
                  <img
                    src={
                      avatarPreview ||
                      user.profilePicture ||
                      "/default-avatar.png"
                    }
                    className="profile-avatar"
                    alt={user.fullName}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setAvatarFile(file);
                      setAvatarPreview(URL.createObjectURL(file));
                    }}
                  />
                  <div className="profile-avatar-overlay">
                    <span>Change</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="profile-hero-info">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {user.fullName}
              </motion.h1>
              <motion.p
                className="profile-email"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                {user.email}
              </motion.p>
              <motion.div
                className="profile-role-badge"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                {user.role}
              </motion.div>
            </div>
          </motion.div>

          {/* Premium Content Grid */}
          <motion.div
            className="profile-content-grid"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Personal Info Card */}
            <motion.div
              className="profile-card personal"
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h2>Personal Information</h2>
              <div className="profile-form">
                <div className="profile-field">
                  <label>Full Name</label>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="profile-field">
                  <label>Bio</label>
                  <textarea
                    name="bio"
                    rows="4"
                    value={form.bio}
                    onChange={handleChange}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="profile-field">
                  <label>City</label>
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Your city"
                  />
                </div>

                <motion.button
                  className="profile-save-btn"
                  onClick={saveProfile}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Save Changes
                </motion.button>
              </div>
            </motion.div>

            {/* Account Card */}
            <motion.div
              className="profile-card account"
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h2>Account Details</h2>

              <div className="profile-stats">
                <div className="profile-stat">
                  <span className="profile-stat-label">Member Since</span>
                  <span className="profile-stat-value">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="profile-stat">
                  <span className="profile-stat-label">Phone</span>
                  <span className="profile-stat-value">{user.phone}</span>
                </div>

                <div className="profile-stat">
                  <span className="profile-stat-label">Email Verified</span>
                  <div
                    className={`profile-stat-badge ${
                      user.isEmailVerified ? "verified" : "pending"
                    }`}
                  >
                    {user.isEmailVerified ? "Verified" : "Pending"}
                  </div>
                </div>
              </div>

              <motion.button
                className="profile-password-btn"
                onClick={goToChangePassword}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Change Password
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      <Toast show={toast.show} message={toast.message} />
    </>
  );
}
