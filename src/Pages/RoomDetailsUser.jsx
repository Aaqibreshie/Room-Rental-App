import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Toast from "../Components/Toast.jsx";
import MiniHeader from "../Components/MiniHeader";
import "../Styles/RoomDetailsUser.css";
import {
  FiHome,
  FiUsers,
  FiLayers,
  FiWind,
  FiSun,
  FiWifi,
  FiGrid,
} from "react-icons/fi";

import {
  MdBed,
  MdChair,
  MdDesk,
  MdLightbulbOutline,
  MdDoorFront,
  MdWindow,
  MdBathtub,
  MdBalcony,
  MdKitchen,
  MdDining,
  MdLocalLaundryService,
  MdTv,
  MdLocalParking,
  MdYard,
  MdSecurity,
  MdHotTub,
  MdCurtains,
} from "react-icons/md";

function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // meters
}

export default function RoomDetailsUser() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "" });

  const [activeIndex, setActiveIndex] = useState(0);
  const [activeStat, setActiveStat] = useState(null);
  /* ----------------------------------
   AMENITY ICON MAP (ROOM + BUILDING)
---------------------------------- */
  const amenityIconMap = {
    // Room amenities
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

    // Building / shared amenities
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

  const roomDetailsRef = useRef(null);
  const buildingRef = useRef(null);
  const rulesRef = useRef(null);

  /* ----------------------------------
     Hide navbar
  ---------------------------------- */
  useEffect(() => {
    document.body.classList.add("hide-navbar");
    return () => document.body.classList.remove("hide-navbar");
  }, []);

  /* ----------------------------------
     Fetch room
  ---------------------------------- */
  useEffect(() => {
    async function fetchRoom() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/rooms/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const data = await res.json();

        if (data.success) {
          const roomData = data.data.room; // ✅ DEFINE HERE
          setIsSaved(data.data.isSavedForUser);

          // 🔹 CALCULATE DISTANCE
          if (
            navigator.geolocation &&
            roomData?.building?.location?.coordinates
          ) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const { latitude, longitude } = pos.coords;
                console.log(
                  "📍 USER LOCATION (lat, lng):",
                  latitude,
                  longitude
                );

                // MongoDB stores as [lng, lat]
                const [buildingLng, buildingLat] =
                  roomData.building.location.coordinates;

                const distance = getDistanceInMeters(
                  latitude,
                  longitude,
                  buildingLat,
                  buildingLng
                );
                console.log(
                  "🏢 BUILDING LOCATION (lat, lng):",
                  buildingLat,
                  buildingLng
                );

                setRoom({
                  ...roomData,
                  distance,
                });
              },
              () => {
                // Location denied → show room without distance
                setRoom(roomData);
              }
            );
          } else {
            setRoom(roomData);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchRoom();
  }, [id]);

  /* ----------------------------------
     Auto image slider
  ---------------------------------- */
  useEffect(() => {
    if (!room?.images?.length) return;
    const interval = setInterval(() => {
      setActiveIndex((i) => (i + 1) % room.images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [room]);

  /* ----------------------------------
     Clear active stat on scroll
  ---------------------------------- */
  useEffect(() => {
    const clear = () => setActiveStat(null);
    window.addEventListener("scroll", clear);
    return () => window.removeEventListener("scroll", clear);
  }, []);

  /* ----------------------------------
     Save / Unsave room (FIXED)
  ---------------------------------- */
  async function saveRoom() {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    const prev = isSaved;
    setIsSaved(!prev);

    try {
      const res = await fetch(
        `http://localhost:5000/api/rooms/${id}/${prev ? "unsave" : "save"}`,
        {
          method: prev ? "DELETE" : "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (!data.success) setIsSaved(prev);

      setToast({
        show: true,
        message: prev ? "Removed from saved rooms" : "Room saved successfully",
      });
      setTimeout(() => setToast({ show: false, message: "" }), 2500);
    } catch {
      setIsSaved(prev);
    }
  }

  function contactOwner() {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }

  if (loading) return <div className="rdp-loading">Loading room…</div>;
  if (!room) return <div className="rdp-loading">Room not found</div>;

  return (
    <>
      <MiniHeader title="Room Details" />
      <motion.div
        className="rdp-container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* ----------------------------------
            HERO SLIDER
        ---------------------------------- */}
        <div className="rdp-hero">
          <div className="rdp-slider">
            {room.images?.length > 0 ? (
              room.images.map((img, index) => (
                <img
                  key={img.url}
                  src={img.url}
                  alt=""
                  className={`rdp-slide ${
                    activeIndex === index ? "active" : ""
                  }`}
                />
              ))
            ) : (
              <div className="rdp-no-img">📷 No Images Available</div>
            )}

            {room.images?.length > 1 && (
              <>
                <div className="rdp-dots">
                  {room.images.map((_, i) => (
                    <span
                      key={i}
                      className={`rdp-dot ${activeIndex === i ? "active" : ""}`}
                      onClick={() => setActiveIndex(i)}
                    />
                  ))}
                </div>

                <button
                  className="rdp-arrow left"
                  onClick={() =>
                    setActiveIndex(
                      (activeIndex + room.images.length - 1) %
                        room.images.length
                    )
                  }
                >
                  ‹
                </button>
                <button
                  className="rdp-arrow right"
                  onClick={() =>
                    setActiveIndex((activeIndex + 1) % room.images.length)
                  }
                >
                  ›
                </button>
              </>
            )}
          </div>

          <div className="rdp-price-badge">
            ₹{room.rentPerMonth?.toLocaleString()} / month
          </div>

          {/* 🔥 DISTANCE BADGE */}
          {room.distance !== undefined && (
            <div className="rdp-distance-badge">
              📍 {(room.distance / 1000).toFixed(1)} km away
            </div>
          )}

          {/* Show All Images */}
          <button
            className="rdp-gallery-btn"
            onClick={() => {
              // later: navigate(`/room/${id}/photos`)
              console.log("Open all photos");
            }}
          >
            <FiGrid />
            <span>Show all photos</span>
          </button>
        </div>

        {/* ----------------------------------
            CONTENT
        ---------------------------------- */}
        <div className="rdp-content">
          <div className="rdp-header">
            <div>
              <h1>{room.title}</h1>
              <p className="rdp-location">
                {room.building?.address?.city}, {room.building?.address?.state}
              </p>
            </div>

            <motion.button
              className={`rdp-save ${isSaved ? "saved" : ""}`}
              onClick={saveRoom}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isSaved ? "✓ Saved" : "💙 Save"}
            </motion.button>
          </div>

          {/* ----------------------------------
              STATS
          ---------------------------------- */}
          <div className="rdp-stats">
            <div className="rdp-stat-card">
              🏠 <strong>{room.roomType}</strong>
            </div>
            <div className="rdp-stat-card">
              🏢 <strong>Floor {room.floor}</strong>
            </div>
            <div className="rdp-stat-card">
              👥 <strong>{room.capacity} persons</strong>
            </div>
          </div>

          {/* ----------------------------------
              DETAILS
          ---------------------------------- */}
          <section className="rdp-section" ref={roomDetailsRef}>
            <h3>Room Details</h3>
            <p>{room.description || "—"}</p>
          </section>

          {/* ----------------------------------
              AMENITIES
          ---------------------------------- */}
          {/* ----------------------------------
    ROOM AMENITIES
---------------------------------- */}
          {room.amenities?.length > 0 && (
            <section className="rdp-section">
              <h3>What This Room Offers</h3>

              <div className="rdp-amenities">
                {room.amenities.map((a, i) => {
                  const key = a.toLowerCase();
                  return (
                    <div key={i} className="rdp-amenity">
                      <span className="icon">{amenityIconMap[key]}</span>
                      <span>{formatLabel(a)}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          {/* ----------------------------------
    BUILDING / SHARED AMENITIES
---------------------------------- */}
          {room.sharedAmenities?.length > 0 && (
            <section className="rdp-section">
              <h3>What Building Offers</h3>

              <div className="rdp-amenities">
                {room.sharedAmenities.map((a, i) => {
                  const key = a.toLowerCase();
                  return (
                    <div key={i} className="rdp-amenity shared">
                      <span className="icon">{amenityIconMap[key]}</span>
                      <span>{formatLabel(a)}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ----------------------------------
              BUILDING
          ---------------------------------- */}
          <section className="rdp-section rdp-building" ref={buildingRef}>
            <h3>Building Details</h3>
            <p>
              {room.building?.address?.street}, {room.building?.address?.city},{" "}
              {room.building?.address?.state}
            </p>
          </section>

          {/* ----------------------------------
              OWNER
          ---------------------------------- */}
          <div className="rdp-owner">
            <img
              src={room.landlord?.profilePicture || "/default-avatar.png"}
              alt=""
            />
            <div>
              <h3 className="rdp-hosted">
                <span className="hosted-label">Hosted by</span>{" "}
                <span className="hosted-name">{room.landlord?.fullName}</span>
              </h3>
            </div>
          </div>
          {room.isAvailable === false && (
            <div className="rdp-unavailable">
              🚫 This room is currently not available
            </div>
          )}

          <motion.button
            className="rdp-book"
            onClick={contactOwner}
            whileHover={{ scale: 1.03 }}
          >
            Book Now / Contact Owner
          </motion.button>
        </div>
      </motion.div>

      <Toast show={toast.show} message={toast.message} />
    </>
  );
}
