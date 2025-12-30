import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  FiMapPin,
  FiEdit,
  FiHome,
  FiWifi,
  FiWind,
  FiSun,
  FiGrid,
} from "react-icons/fi";
import {
  MdPeople,
  MdApartment,
  MdBed,
  MdChair,
  MdDesk,
  MdLightbulbOutline,
  MdDoorFront,
  MdWindow,
  MdBathtub,
  MdBalcony,
  MdLocalParking,
  MdKitchen,
  MdCurtains,
  MdDining,
  MdLocalLaundryService,
  MdTv,
  MdSecurity,
  MdYard,
  MdHotTub,
} from "react-icons/md";

import "../Styles/RoomDetails.css";

export default function RoomDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  /* ================= FETCH ROOM ================= */
  useEffect(() => {
    fetchRoom();
  }, []);

  async function fetchRoom() {
    try {
      const res = await fetch(`http://localhost:5000/api/rooms/${id}`);
      const data = await res.json();
      if (data.success) setRoom(data.data.room);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  /* ================= SLIDER ================= */
  useEffect(() => {
    if (!room?.images?.length) return;
    const i = setInterval(
      () => setActiveIndex((p) => (p + 1) % room.images.length),
      3500
    );
    return () => clearInterval(i);
  }, [room]);

  /* ================= TOGGLE AVAILABILITY ================= */
  async function toggleAvailability() {
    if (updatingStatus) return;

    setUpdatingStatus(true);

    try {
      const res = await fetch(
        `http://localhost:5000/api/rooms/${room._id}/toggle-availability`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();

      if (data.success) {
        setRoom((prev) => ({
          ...prev,
          isAvailable: data.data.isAvailable,
        }));
      } else {
        alert("Failed to update availability");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (loading) return <div className="rd-loading">Loading…</div>;
  if (!room) return <div className="rd-error">Room not found</div>;

  /* ================= AMENITIES ================= */
  const amenityIconMap = {
    bed: <MdBed />,
    mattress: <MdBed />,
    pillow: <MdBed />,
    cupboard: <MdDoorFront />,
    desk: <MdDesk />,
    chair: <MdChair />,
    fan: <FiWind />,
    ac: <FiWind />,
    heater: <FiSun />,
    lights: <MdLightbulbOutline />,
    curtains: <MdCurtains />,
    carpet: <FiGrid />,
    window: <MdWindow />,
    balcony: <MdBalcony />,
    bathroom: <MdBathtub />,
    attached_bathroom: <MdBathtub />,
    hot_water: <MdHotTub />,
    kitchen: <MdKitchen />,
    dining_area: <MdDining />,
    living_room: <FiHome />,
    common_tv: <MdTv />,
    laundry: <MdLocalLaundryService />,
    internet: <FiWifi />,
    parking: <MdLocalParking />,
    garden: <MdYard />,
    security_guard: <MdSecurity />,
  };

  const formatLabel = (txt) =>
    txt.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="rd-container">
      {/* ================= SLIDER ================= */}
      <div className="rd-slider">
        {room.images?.map((img, i) => (
          <img
            key={i}
            src={img.url}
            alt=""
            className={`rd-slide ${i === activeIndex ? "active" : ""}`}
          />
        ))}
        {/* View all photos */}
        {room.images?.length > 0 && (
          <button
            className="rd-view-photos"
            onClick={() => navigate(`/dashboard/room/${room._id}/photos`)}
          >
            <FiGrid />
            <span>View all photos ({room.images.length})</span>
          </button>
        )}
      </div>

      {/* ================= HEADER ================= */}
      <div className="rd-header">
        <div>
          <h1>{room.title}</h1>
          <p>
            <FiMapPin /> {room.building?.address?.city},{" "}
            {room.building?.address?.state}
          </p>
        </div>

        <div className="rd-price-wrap">
          <div className="rd-price">
            ₹{room.rentPerMonth}
            <span>/month</span>
          </div>

          <div
            className={`rd-status ${
              room.isAvailable ? "available" : "unavailable"
            }`}
          >
            {room.isAvailable ? "Available" : "Unavailable"}
          </div>
        </div>
      </div>

      {/* ================= STATS ================= */}
      <div className="rd-stats">
        <div>
          <MdPeople /> {room.capacity} Guests
        </div>
        <div>
          <MdApartment /> Floor {room.floor}
        </div>
      </div>

      {/* ================= DESCRIPTION ================= */}
      <section className="rd-section">
        <h2>About this room</h2>
        <p>{room.description}</p>
      </section>

      {/* ================= AMENITIES ================= */}
      <section className="rd-section">
        <h2>What this place offers</h2>
        <div className="rd-amenities">
          {room.amenities?.map((a, i) => {
            const key = a.toLowerCase();
            return (
              <div key={i} className="rd-amenity-card">
                <span className="icon">{amenityIconMap[key]}</span>
                <span>{formatLabel(a)}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= SHARED ================= */}
      <section className="rd-section">
        <h2>Shared amenities</h2>
        <div className="rd-amenities">
          {room.sharedAmenities?.map((a, i) => {
            const key = a.toLowerCase();
            return (
              <div key={i} className="rd-amenity-card shared">
                <span className="icon">{amenityIconMap[key]}</span>
                <span>{formatLabel(a)}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= OWNER ACTIONS ================= */}
      <div className="rd-cta">
        <button
          className="rd-btn primary"
          onClick={() => navigate(`/dashboard/edit-room/${room._id}`)}
        >
          <FiEdit /> Edit Room
        </button>

        <button
          className="rd-btn secondary"
          onClick={toggleAvailability}
          disabled={updatingStatus}
        >
          {room.isAvailable ? "Mark Unavailable" : "Mark Available"}
        </button>
      </div>
    </div>
  );
}
