import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../Styles/MyRooms.css";
// import Navbar2 from "../Components/Navbar2.jsx";

export default function MyRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  /* -----------------------------
     OPTIMISTIC AVAILABILITY TOGGLE
  ------------------------------ */
  async function toggleAvailability(roomId) {
    setTogglingId(roomId);

    // optimistic UI update
    setRooms((prev) =>
      prev.map((r) =>
        r._id === roomId ? { ...r, isAvailable: !r.isAvailable } : r
      )
    );

    try {
      const res = await fetch(
        `http://localhost:5000/api/rooms/${roomId}/toggle-availability`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!res.ok) throw new Error("Toggle failed");
    } catch (err) {
      // revert on failure
      setRooms((prev) =>
        prev.map((r) =>
          r._id === roomId ? { ...r, isAvailable: !r.isAvailable } : r
        )
      );
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  }

  /* -----------------------------
     FETCH ROOMS
  ------------------------------ */
  useEffect(() => {
    async function fetchRooms() {
      try {
        const res = await fetch("http://localhost:5000/api/rooms/my-rooms", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const data = await res.json();
        if (data.success) setRooms(data.data);
      } catch (err) {
        console.error("Error loading rooms:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRooms();
  }, []);

  /* -----------------------------
     TOAST CLEANUP
  ------------------------------ */
  useEffect(() => {
    if (location.state?.message) {
      const timer = setTimeout(() => {
        navigate(location.pathname, { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [location.state, navigate, location.pathname]);

  /* -----------------------------
     DELETE ROOM
  ------------------------------ */
  async function handleDelete(roomId) {
    if (!roomId) return;

    try {
      const res = await fetch(`http://localhost:5000/api/rooms/${roomId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (res.status === 404) {
        setRooms((prev) => prev.filter((r) => r._id !== roomId));
        setShowDeleteModal(false);
        return;
      }

      const data = await res.json();
      if (data.success) {
        setRooms((prev) => prev.filter((r) => r._id !== roomId));
        setShowDeleteModal(false);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  }

  if (loading) {
    return (
      <div className="myrooms-loading">
        <span className="loader"></span>
      </div>
    );
  }

  return (
    <div className="myrooms-page">
      {location.state?.message && (
        <div className="mr-toast">{location.state.message}</div>
      )}

      {/* <Navbar2 /> */}

      <div className="myrooms-header">
        <h1>Your Rooms</h1>
        <button
          className="add-btn"
          onClick={() => navigate("/dashboard/create-room")}
        >
          + Add Room
        </button>
      </div>

      {rooms.length === 0 ? (
        <div className="myrooms-empty">
          <h2>No rooms added yet</h2>
          <p>Start adding your rooms to manage them easily.</p>
          <button
            className="add-btn"
            onClick={() => navigate("/dashboard/create-room")}
          >
            Add First Room
          </button>
        </div>
      ) : (
        <div className="myrooms-grid">
          {rooms.map((room) => (
            <div className="room-card" key={room._id}>
              <div className="room-img-box">
                <img
                  src={room.images?.[0]?.url || "/placeholder.jpg"}
                  alt={room.title}
                />
                <span className="room-badge">{room.roomType}</span>
              </div>

              <div className="room-content">
                <h3 className="room-title">{room.title}</h3>

                <p className="room-location">
                  {room.building?.name} • {room.building?.address?.city}
                </p>

                <div className="room-info">
                  <span>{room.capacity} Person(s)</span>
                  <span>Floor {room.floor}</span>
                </div>

                <div className="room-price">
                  ₹{room.rentPerMonth.toLocaleString()}/month
                </div>

                {/* Availability */}
                <div className="availability-toggle">
                  <div
                    className={`toggle-switch ${
                      room.isAvailable ? "available" : ""
                    } ${togglingId === room._id ? "disabled" : ""}`}
                    onClick={() =>
                      togglingId ? null : toggleAvailability(room._id)
                    }
                  >
                    <div className="toggle-knob"></div>
                  </div>

                  <span className="toggle-label">
                    {room.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>

                {/* Actions */}
                <div className="room-actions">
                  <button
                    className="view-btn"
                    onClick={() => navigate(`/dashboard/room/${room._id}`)}
                  >
                    View
                  </button>

                  <button
                    className="edit-btn"
                    onClick={() => navigate(`/dashboard/edit-room/${room._id}`)}
                  >
                    Edit
                  </button>

                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRoomToDelete(room._id);
                      setShowDeleteModal(true);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDeleteModal && (
        <div className="delete-overlay">
          <div className="delete-modal">
            <h2>Delete Room?</h2>
            <p>This action cannot be undone.</p>

            <div className="delete-modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>

              <button
                className="confirm-delete-btn"
                onClick={() => handleDelete(roomToDelete)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
