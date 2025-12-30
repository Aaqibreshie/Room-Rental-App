import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useState } from "react";
import "../Styles/RoomCard.css";

export default function RoomCard({ room, savedRoomIds, onToggleSave }) {
  console.log(room.building);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  // const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const isSaved = savedRoomIds?.has(room._id);

  async function toggleSave(e) {
    e.stopPropagation();

    if (!token) {
      navigate("/login");
      return;
    }

    setSaving(true);
    onToggleSave?.(room._id, !isSaved); // optimistic update

    try {
      await fetch(`http://localhost:5000/api/auth/saved-rooms/${room._id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      className="roomCard"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onClick={() => navigate(`/room-user/${room._id}`)}
    >
      <div className="roomImageWrap">
        <motion.img
          src={room.images?.[0]?.url || "/placeholder.jpg"}
          alt={room.title}
          className="roomImage"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />

        <motion.button
          className={`heartBtn ${isSaved ? "saved" : ""}`}
          onClick={toggleSave}
          whileTap={{ scale: 0.75 }}
          whileHover={{ scale: 1.15 }}
          animate={
            isSaved
              ? { scale: [1, 1.3, 0.95, 1], rotate: [0, -8, 8, 0] }
              : { scale: 1, rotate: 0 }
          }
          transition={{ duration: 0.35, ease: "easeOut" }}
          disabled={saving}
          title={isSaved ? "Saved" : "Save"}
        >
          {saving ? (
            <span className="heartLoader" />
          ) : isSaved ? (
            <FaHeart />
          ) : (
            <FaRegHeart />
          )}
        </motion.button>
      </div>

      <div className="roomContent">
        <h3 className="roomTitle">{room.title}</h3>

        <p className="roomBuilding">{room.building?.name}</p>

        <p className="roomLocation">
          {room.building?.address?.city
            ? `${room.building.address.city}, ${room.building.address.state}`
            : "Location not available"}
        </p>

        <div className="roomMeta">
          <div className="price">
            ₹{room.rentPerMonth?.toLocaleString()}/month
          </div>
        </div>
      </div>
    </motion.div>
  );
}
