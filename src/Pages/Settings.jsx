import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/Settings.css";

export default function Settings() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [user, setUser] = useState(null);

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [removeImageFlag, setRemoveImageFlag] = useState(false);

  const [currentPassword, setcurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("http://localhost:5000/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return;

        const u = data.data;
        setUser(u);

        setFullName(u.fullName || "");
        setBio(u.bio || "");
        setGender(u.gender || "");
        setDateOfBirth(u.dateOfBirth ? u.dateOfBirth.split("T")[0] : "");
        setAddress(u.address?.city || "");
        setPreview(u.profilePicture || null);
        setNewEmail(u.email);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
      setRemoveImageFlag(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreview(null);
    setRemoveImageFlag(true);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const token = localStorage.getItem("token");
    const formData = new FormData();

    formData.append("fullName", fullName);
    formData.append("bio", bio);
    formData.append("gender", gender);
    formData.append("dateOfBirth", dateOfBirth);
    formData.append("address", address);

    if (imageFile) formData.append("image", imageFile);
    if (removeImageFlag) formData.append("removeImage", "1");

    try {
      const res = await fetch("http://localhost:5000/api/auth/profile", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      alert("Profile updated successfully!");
      window.location.reload();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      return alert("New passwords do not match!");
    }

    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:5000/api/auth/change-password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword,
      }),
    });

    const data = await res.json();

    if (!data.success) return alert(data.message);

    alert("Password updated!");
    setcurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:5000/api/auth/change-email", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ newEmail }),
    });

    const data = await res.json();

    if (!data.success) return alert(data.message);

    alert("Email updated!");
  };

  if (loading) return <div className="settings-loading">Loading…</div>;

  return (
    <div className="settings-page">
      <header className="settings-hero">
        <div>
          <h1>Account settings</h1>
          <p>Update your profile, email and password in one place.</p>
        </div>
      </header>

      <div className="settings-layout">
        {/* Left: tabs */}
        <aside className="settings-nav">
          <button
            type="button"
            className={`settings-nav-item ${
              activeTab === "profile" ? "active" : ""
            }`}
            onClick={() => setActiveTab("profile")}
          >
            <span className="settings-nav-title">Profile</span>
            <span className="settings-nav-sub">Photo, bio & details</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${
              activeTab === "security" ? "active" : ""
            }`}
            onClick={() => setActiveTab("security")}
          >
            <span className="settings-nav-title">Security</span>
            <span className="settings-nav-sub">Email & password</span>
          </button>
        </aside>

        {/* Right: content */}
        <section className="settings-content">
          {activeTab === "profile" && (
            <form className="settings-section" onSubmit={handleProfileSave}>
              {/* Profile card */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <h2>Public profile</h2>
                  <p>
                    This information appears on your Roomify profile and
                    listings.
                  </p>
                </div>

                <div className="settings-profile-row">
                  <div className="settings-avatar-col">
                    <div className="settings-avatar-wrap">
                      <img
                        src={preview || "/default-avatar.png"}
                        className="settings-avatar-img"
                        alt="profile"
                      />
                    </div>

                    <div className="settings-avatar-actions">
                      <label className="btn-soft">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                        Upload photo
                      </label>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={handleRemoveImage}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="settings-fields-col">
                    <div className="settings-field">
                      <label>Full name</label>
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>

                    <div className="settings-field">
                      <label>Bio</label>
                      <textarea
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                      />
                    </div>

                    <div className="settings-field-row">
                      <div className="settings-field">
                        <label>Gender</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                        >
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className="settings-field">
                        <label>Date of birth</label>
                        <input
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address card */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <h2>Location</h2>
                  <p>Used to personalise recommendations and listings.</p>
                </div>

                <div className="settings-field">
                  <label>City / area</label>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="settings-footer">
                <button className="btn-primary" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "security" && (
            <div className="settings-section">
              {/* Email card */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <h2>Email</h2>
                  <p>Update the email used for login and notifications.</p>
                </div>

                <form onSubmit={handleEmailChange}>
                  <div className="settings-field">
                    <label>New email</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn-primary">
                    Update email
                  </button>
                </form>
              </div>

              {/* Password card */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <h2>Password</h2>
                  <p>Choose a strong, unique password for your account.</p>
                </div>

                <form onSubmit={handlePasswordChange}>
                  <div className="settings-field">
                    <label>Current password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setcurrentPassword(e.target.value)}
                    />
                  </div>

                  <div className="settings-field">
                    <label>New password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div className="settings-field">
                    <label>Confirm new password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn-primary">
                    Update password
                  </button>
                </form>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
