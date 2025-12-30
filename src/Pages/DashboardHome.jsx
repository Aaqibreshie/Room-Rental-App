import React, { useEffect, useState } from "react";
// import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function DashboardHome() {
  const [user, setUser] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // ---- DATA FETCHING ----

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Fetch user
    fetch("http://localhost:5000/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => data.success && setUser(data.data));

    // Fetch buildings
    fetch("http://localhost:5000/api/buildings/my-buildings", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => data.success && setBuildings(data.data));

    // Fetch rooms
    fetch("http://localhost:5000/api/rooms/my-rooms", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => data.success && setRooms(data.data));
    setTimeout(() => setLoading(false), 400);
  }, []);

  // ---- ANALYTICS CALCULATIONS ----

  const totalRooms = rooms.length;

  const vacantRooms = rooms.filter((r) => r.isAvailable === true).length;
  const occupiedRooms = totalRooms - vacantRooms;

  const totalTenants = rooms
    .filter((r) => r.isAvailable === false)
    .reduce((sum, r) => sum + (r.occupancyCount || 1), 0);

  // Profile completion %
  const profileScore = (() => {
    let score = 0;
    if (user?.fullName) score += 20;
    if (user?.bio) score += 15;
    if (user?.profilePicture) score += 20;
    if (user?.address?.city) score += 20;
    if (user?.phone) score += 15;
    if (user?.email) score += 10;
    return score;
  })();
  if (loading) {
    return (
      <div className="dashboard-content">
        <div className="dashboard-header skeleton-header" />

        <div className="welcome-box skeleton-box" />
        <div className="alert-card skeleton-box" />
        <div className="profile-box skeleton-box" />
        <div className="welcome-box skeleton-box" />
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1 className="dash-title">Dashboard</h1>

        <div className="dash-user">
          <span>Hello, {user?.fullName}</span>
          <img
            src={user?.profilePicture || "/default-avatar.png"}
            className="dash-user-img"
            alt="user"
            onClick={() => navigate("/dashboard/settings")}
          />
        </div>
      </div>

      {/* Welcome Box */}
      <div className="welcome-box">
        <h2>Welcome back, {user?.fullName?.split(" ")[0]} 👋</h2>

        <p className="welcome-sub">
          Here’s a quick look at your complete hosting performance.
        </p>

        {/* Primary Stats */}
        <div className="dash-stats-grid">
          <div className="stat-card">
            <h3>{buildings.length}</h3>
            <p>Buildings Listed</p>
          </div>

          <div className="stat-card">
            <h3>{totalRooms}</h3>
            <p>Total Rooms</p>
          </div>

          <div className="stat-card">
            <h3>{vacantRooms}</h3>
            <p>Vacant Rooms</p>
          </div>

          <div className="stat-card">
            <h3>{occupiedRooms}</h3>
            <p>Occupied Rooms</p>
          </div>

          <div className="stat-card">
            <h3>{totalTenants}</h3>
            <p>Total Tenants</p>
          </div>
        </div>
        {/* QUICK ACTIONS */}
        <div className="quick-actions">
          <div
            className="stat-card action-card"
            onClick={() => navigate("/dashboard/create-building")}
          >
            <h3>➕</h3>
            <p>Add Building</p>
          </div>

          <div
            className="stat-card action-card"
            onClick={() => navigate("/dashboard/create-room")}
          >
            <h3>🏠</h3>
            <p>Add Room</p>
          </div>

          <div
            className="stat-card action-card"
            onClick={() => navigate("/dashboard/my-rooms")}
          >
            <h3>📋</h3>
            <p>Manage Rooms</p>
          </div>
        </div>
      </div>
      {vacantRooms > 0 && (
        <div className="alert-card">
          <div>
            <h3>
              {vacantRooms} room{vacantRooms > 1 && "s"} vacant
            </h3>
            <p>
              These rooms are currently not occupied. Consider updating pricing,
              photos, or availability.
            </p>
          </div>

          <button
            className="alert-btn"
            onClick={() => navigate("/dashboard/my-rooms")}
          >
            Manage Rooms
          </button>
        </div>
      )}

      {/* Profile Completion */}
      <div className="profile-box">
        <h2>Your Profile Status</h2>
        <p className="welcome-sub">
          Improve your profile to attract more tenants.
        </p>

        <div className="profile-progress">
          <div
            className="profile-progress-fill"
            style={{ width: `${profileScore}%` }}
          />
        </div>

        <p style={{ marginTop: "8px", fontWeight: 600 }}>
          Profile Completion: {profileScore}%
        </p>
      </div>

      {/* Activity Summary */}
      <div className="welcome-box" style={{ marginTop: "20px" }}>
        <h2>Activity Summary</h2>
        <p className="welcome-sub">Your hosting performance insights</p>

        <div className="dash-stats-grid">
          <div className="stat-card">
            <h3>
              {
                rooms.filter(
                  (r) =>
                    new Date(r.createdAt) >
                    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                ).length
              }
            </h3>
            <p>New Rooms (7 days)</p>
          </div>

          <div className="stat-card">
            <h3>
              {
                buildings.filter(
                  (b) =>
                    new Date(b.createdAt) >
                    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                ).length
              }
            </h3>
            <p>New Buildings (7 days)</p>
          </div>

          <div className="stat-card">
            <h3>{rooms.filter((r) => r.isAvailable === false).length}</h3>
            <p>Currently Occupied</p>
          </div>

          <div className="stat-card">
            <h3>{rooms.filter((r) => r.isAvailable === true).length}</h3>
            <p>Available for Listing</p>
          </div>
        </div>
      </div>
    </div>
  );
}
