import { useRef } from "react";
import "../Styles/FilterBar.css";
import {
  FaHome,
  FaUserFriends,
  FaBed,
  FaBuilding,
  FaWarehouse,
} from "react-icons/fa";

export default function FilterBar({ selected, setSelected }) {
  const chipRefs = useRef({});

  const filters = [
    { id: "all", label: "All", icon: <FaHome /> },
    { id: "single", label: "Single Room", icon: <FaBed /> },
    { id: "shared", label: "Shared Room", icon: <FaUserFriends /> },
    { id: "pg", label: "PG", icon: <FaBuilding /> },
    { id: "hostel", label: "Hostel", icon: <FaWarehouse /> },
  ];

  return (
    <div className="newFilterBar">
      {/* Airbnb Fade Left/Right */}
      <div className="scrollFade leftFade"></div>
      <div className="scrollFade rightFade"></div>

      <div className="filterTrack">
        {filters.map((f) => (
          <div
            key={f.id}
            ref={(el) => (chipRefs.current[f.id] = el)}
            onClick={() => setSelected(f.id)}
            className={`filterChip ${selected === f.id ? "activeChip" : ""}`}
          >
            <span className="chipIcon">{f.icon}</span>
            <span className="chipLabel">{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
