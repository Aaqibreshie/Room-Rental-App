import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar2 from "../Components/Navbar2";
import Footer from "../Components/Footer";
import "../Styles/MyBuildings.css";
import { useLocation } from "react-router-dom";
import { FiPlus, FiEdit, FiTrash2, FiEye, FiHome } from "react-icons/fi";

export default function MyBuildings() {
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // ⭐ ADDED FOR DELETE POPUP
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  useEffect(() => {
    if (location.state?.message) {
      const timer = setTimeout(() => {
        navigate(location.pathname, { replace: true }); // remove state
      }, 3000); // toast disappears in 3 seconds

      return () => clearTimeout(timer);
    }
  }, [location.state]);

  async function fetchBuildings() {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        "http://localhost:5000/api/buildings/my-buildings",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (data.success) setBuildings(data.data);
      console.log(data.data);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBuildings();
  }, []);

  // ⭐ DELETE WITH POPUP
  async function confirmDelete() {
    if (!selectedBuilding) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:5000/api/buildings/${selectedBuilding}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();

      if (data.success) {
        setShowDeletePopup(false);
        setSelectedBuilding(null);
        fetchBuildings();
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return <div className="mb-loading">Loading...</div>;

  return (
    <>
      {/* <Navbar2 /> */}
      {location.state?.message && (
        <div className="mb-toast">{location.state.message}</div>
      )}

      <div className="myBuildingsWrapper">
        <div className="mb-header">
          <div>
            <h1 className="mb-title">My Buildings</h1>
            <p className="mb-subtitle">
              Manage all your listed properties easily
            </p>
          </div>

          <button
            className="mb-createBtn"
            onClick={() => navigate("/dashboard/create-building")}
          >
            + Create New Building
          </button>
        </div>

        {buildings.length === 0 ? (
          <div className="mb-emptyBox">
            <img src="/empty-box.png" className="mb-emptyImg" />
            <h2>No Buildings Yet</h2>
            <p>You have not added any buildings yet.</p>

            <button
              className="mb-createBtn big"
              onClick={() => navigate("/dashboard/create-building")}
            >
              + Add Your First Building
            </button>
          </div>
        ) : (
          <div className="mb-grid">
            {buildings.map((b) => (
              <div key={b._id} className="mb-card">
                <div className="mb-imgWrapper">
                  <img
                    src={b.images?.[0]?.url || "/placeholder.jpg"}
                    alt="building"
                    className="mb-img"
                  />
                </div>

                <div className="mb-info">
                  <h2 className="mb-buildingName">{b.name}</h2>
                  <p className="mb-address">
                    {b.address.city}, {b.address.state}
                  </p>

                  <p className="mb-details">
                    Floors: {b.totalFloors} • Rooms: {b.totalRooms || "N/A"}
                  </p>

                  <div className="mb-actions">
                    <button
                      className="mb-btn primary"
                      onClick={() =>
                        navigate(`/dashboard/create-room?building=${b._id}`)
                      }
                    >
                      <FiPlus /> Add Room
                    </button>

                    <button
                      className="mb-btn outline"
                      onClick={() =>
                        navigate(`/dashboard/building/${b._id}/rooms`)
                      }
                    >
                      <FiEye /> View
                    </button>

                    <button
                      className="mb-btn edit"
                      onClick={() =>
                        navigate(`/dashboard/edit-building/${b._id}`)
                      }
                    >
                      <FiEdit /> Edit
                    </button>

                    <button
                      className="mb-btn danger"
                      onClick={() => {
                        setSelectedBuilding(b._id);
                        setShowDeletePopup(true);
                      }}
                    >
                      <FiTrash2 /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* <Footer /> */}

      {/* ⭐ MODERN DELETE CONFIRMATION POPUP */}
      {showDeletePopup && (
        <div className="deleteOverlay">
          <div className="deleteBox">
            <h3>Delete Building?</h3>
            <p>This action cannot be undone.</p>

            <div className="deleteActions">
              <button onClick={() => setShowDeletePopup(false)}>Cancel</button>

              <button className="dangerDel" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
