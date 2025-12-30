import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import RoomCard from "../Components/RoomCard";
import MiniHeader from "../Components/MiniHeader";
import "../Styles/UserSavedRooms.css";

export default function SavedRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    async function fetchSavedRooms() {
      try {
        const res = await fetch("http://localhost:5000/api/auth/saved-rooms", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setRooms(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchSavedRooms();
    window.addEventListener("savedRoomsUpdated", fetchSavedRooms);
    return () =>
      window.removeEventListener("savedRoomsUpdated", fetchSavedRooms);
  }, [navigate]);

  // saved ids for heart state
  const savedRoomIds = useMemo(() => new Set(rooms.map((r) => r._id)), [rooms]);

  function handleToggleSave(roomId, shouldSave) {
    if (!shouldSave) {
      setRooms((prev) => prev.filter((r) => r._id !== roomId));
    }
  }

  return (
    <>
      <MiniHeader title="Saved Rooms" />

      <motion.div
        className="saved-container"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {/* Subtle intro (not a hero) */}
        {!loading && rooms.length > 0 && (
          <p className="saved-subtitle">
            Your favourite places, all in one spot
          </p>
        )}

        {loading ? (
          <div className="saved-loading">Loading saved rooms…</div>
        ) : rooms.length === 0 ? (
          <div className="saved-empty">
            <h3>No saved rooms yet</h3>
            <p>Tap the ❤️ icon on rooms you like</p>
          </div>
        ) : (
          <div className="saved-grid">
            {rooms.map((room) => (
              <RoomCard
                key={room._id}
                room={room}
                savedRoomIds={savedRoomIds}
                onToggleSave={handleToggleSave}
              />
            ))}
          </div>
        )}
      </motion.div>
    </>
  );
}
