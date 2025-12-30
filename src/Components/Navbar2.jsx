import React from "react";
import { NavLink } from "react-router-dom";
import { FiHome, FiUser } from "react-icons/fi";
import "../Styles/Navbar2.css";

export default function Navbar2() {
  return (
    <nav className="nav2">
      <div className="nav2-container">
        {/* Logo */}
        <div className="nav2-left">
          <h2 className="nav2-logo">Roomify</h2>
        </div>

        {/* Navigation Links */}
        <div className="nav2-links">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "nav2-link active" : "nav2-link"
            }
          >
            <FiHome className="nav2-icon" />
            <span>Go to Dashboard</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              isActive ? "nav2-link active" : "nav2-link"
            }
          >
            <FiUser className="nav2-icon" />
            <span>Profile</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
