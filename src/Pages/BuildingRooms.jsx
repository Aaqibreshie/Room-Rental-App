import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiLayers,
  FiDollarSign,
  FiArrowRight,
  FiPlus,
} from "react-icons/fi";
import "../Styles/BuildingRooms.css";

export default function BuildingRooms() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [building, setBuilding] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchRooms() {
    try {
      const res = await fetch(`http://localhost:5000/api/rooms/building/${id}`);
      const data = await res.json();

      if (data.success) setRooms(data.data);

      const bRes = await fetch(`http://localhost:5000/api/buildings/${id}`);
      const bData = await bRes.json();

      if (bData.success) setBuilding(bData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRooms();
  }, []);

  if (loading) return <div className="br-loading">Loading rooms…</div>;

  return (
    <div className="br-container">
      {/* ================= HEADER ================= */}
      <div className="br-header">
        <div>
          <h1>{building?.name}</h1>

          {/* ✅ LANDLORD-CORRECT COPY */}
          <p className="br-subtitle">
            You have listed {rooms.length} room
            {rooms.length !== 1 && "s"} in this building
          </p>
        </div>

        {/* ADD ROOM ACTION */}
        <button
          className="br-add-btn"
          onClick={() => navigate(`/dashboard/create-room?building=${id}`)}
        >
          <FiPlus /> Add Room
        </button>
      </div>

      {/* ================= EMPTY STATE ================= */}
      {rooms.length === 0 ? (
        <div className="br-empty">
          <img src="/empty-box.png" alt="No rooms" />
          <h2>No rooms added yet</h2>
          <p>Add your first room to start receiving tenants.</p>

          <button
            className="br-add-btn large"
            onClick={() => navigate(`/dashboard/create-room?building=${id}`)}
          >
            <FiPlus /> Add First Room
          </button>
        </div>
      ) : (
        /* ================= ROOMS GRID ================= */
        <div className="br-grid">
          {rooms.map((room) => (
            <div key={room._id} className="br-card">
              <div className="br-imgBox">
                <img
                  src={room.images?.[0]?.url || "/placeholder.jpg"}
                  alt={room.title}
                />
              </div>

              <div className="br-title-row">
                <h3 className="br-title">{room.title}</h3>

                <span
                  className={`br-status ${
                    room.isAvailable ? "available" : "unavailable"
                  }`}
                >
                  {room.isAvailable ? "Available" : "Unavailable"}
                </span>
              </div>

              <div className="br-info">
                <p>
                  <FiHome /> {room.roomType}
                </p>
                <p>
                  <FiUsers /> Capacity: {room.capacity}
                </p>
                <p>
                  <FiLayers /> Floor: {room.floor}
                </p>
                <p>
                  <FiDollarSign /> ₹{room.rentPerMonth} / month
                </p>
              </div>

              {/* ✅ LANDLORD CTA */}
              <button
                className="br-view-btn"
                onClick={() => navigate(`/dashboard/room/${room._id}`)}
              >
                Manage Room <FiArrowRight />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
