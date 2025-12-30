import { useEffect, useState } from "react";
import "../Styles/Home.css";
import { motion } from "framer-motion";

import Navbar from "../Components/Navbar";
import RoomCard from "../Components/RoomCard";
import RoomCardSkeleton from "../Components/RoomCardSkeleton";
import Footer from "../Components/Footer";
import FilterBar from "../Components/FilterBar";

export default function Home() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationLabel, setLocationLabel] = useState("near you");

  const [filters, setFilters] = useState({
    type: "",
    location: "",
    max: "",
  });

  const [currentUser, setCurrentUser] = useState(null);

  const savedRoomIds = new Set(
    (currentUser?.savedRooms || []).map((id) =>
      typeof id === "string" ? id : id?._id
    )
  );

  // 🔹 Fetch user + rooms
  useEffect(() => {
    fetchCurrentUser();

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchRoomsSortedByDistance(latitude, longitude);
      },
      () => {
        alert("Location access is required to show nearby rooms.");
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  async function fetchCurrentUser() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setCurrentUser(data.data);
    } catch (err) {
      console.error(err);
    }
  }

  // 🔹 Fetch rooms sorted by distance
  async function fetchRoomsSortedByDistance(lat, lng) {
    try {
      const res = await fetch(
        `http://localhost:5000/api/rooms/nearby-all?lat=${lat}&lng=${lng}`
      );

      const data = await res.json();

      if (data.success) {
        const roomsWithDistance = data.data.map((item) => ({
          ...item.room,
          building: item.building,
          distance: item.distance,
        }));

        setRooms(roomsWithDistance);
        setLocationLabel("near you");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // 🔹 Filters
  const filteredRooms = rooms.filter((room) => {
    if (
      filters.type &&
      room.roomType?.toLowerCase() !== filters.type.toLowerCase()
    ) {
      return false;
    }

    if (
      filters.location &&
      !room.building?.address?.city
        ?.toLowerCase()
        .includes(filters.location.toLowerCase())
    ) {
      return false;
    }

    if (filters.max && room.rentPerMonth > Number(filters.max)) {
      return false;
    }

    return true;
  });

  return (
    <>
      <Navbar />

      <FilterBar
        selected={filters.type || "all"}
        setSelected={(value) =>
          setFilters((prev) => ({
            ...prev,
            type: value === "all" ? "" : value,
          }))
        }
      />

      <div className="homeContainer">
        <div className="homeContent">
          <motion.h2
            className="sectionTitle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Explore Rooms {locationLabel}
          </motion.h2>

          {/* 🔹 LOADING STATE (SKELETONS) */}
          {loading ? (
            <div className="roomGrid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="roomGridItem">
                  <RoomCardSkeleton />
                </div>
              ))}
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="noRoomsBox">
              <img
                src="/empty-box.png"
                className="noRoomsImg"
                alt="No rooms available"
              />
              <h3>No rooms match your filters</h3>
              <p>
                Try changing location, budget, or room type to see more options.
              </p>
            </div>
          ) : (
            <motion.div
              className="roomGrid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {filteredRooms.map((room, i) => (
                <motion.div
                  key={room._id}
                  className="roomGridItem"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <RoomCard
                    room={room}
                    savedRoomIds={savedRoomIds}
                    onToggleSave={(roomId, isNowSaved) => {
                      setCurrentUser((prev) => {
                        if (!prev) return prev;

                        return {
                          ...prev,
                          savedRooms: isNowSaved
                            ? [...prev.savedRooms, roomId]
                            : prev.savedRooms.filter(
                                (r) =>
                                  (r._id ?? r).toString() !== roomId.toString()
                              ),
                        };
                      });
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
