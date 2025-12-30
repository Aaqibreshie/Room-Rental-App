import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import "../Styles/DashboardHome.css";
import { NavLink } from "react-router-dom";

export default function DashboardLayout() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <h2 className="dash-logo">Roomify Host</h2>

        <nav className="dash-menu">
          <NavLink to="/dashboard" end className="dash-link">
            Dashboard
          </NavLink>

          <NavLink to="/dashboard/my-buildings" className="dash-link">
            My Buildings
          </NavLink>

          <NavLink to="/dashboard/my-rooms" className="dash-link">
            My Rooms
          </NavLink>

          <NavLink to="/dashboard/settings" className="dash-link">
            Settings
          </NavLink>

          <a className="dash-link logout" onClick={handleLogout}>
            Logout
          </a>
        </nav>
      </aside>

      {/* Main content loads here */}
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}
