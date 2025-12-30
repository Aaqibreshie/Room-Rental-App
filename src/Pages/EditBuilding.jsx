import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Footer from "../Components/Footer";
import {
  FiHome,
  FiMapPin,
  FiImage,
  FiLayers,
  FiHash,
  FiEdit2,
} from "react-icons/fi";
import "../Styles/EditBuilding.css";

export default function EditBuilding() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [building, setBuilding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    buildingType: "",
    totalFloors: "",
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  async function fetchBuilding() {
    try {
      const res = await fetch(`http://localhost:5000/api/buildings/${id}`);
      const data = await res.json();

      if (data.success) {
        setBuilding(data.data);
        setForm({
          name: data.data.name,
          buildingType: data.data.buildingType,
          totalFloors: data.data.totalFloors,
          address: data.data.address,
        });
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBuilding();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;

    if (name.includes("address.")) {
      const field = name.split(".")[1];
      setForm((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value,
        },
      }));
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setUpdating(true);

    try {
      const token = localStorage.getItem("token");

      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("buildingType", form.buildingType);
      fd.append("totalFloors", form.totalFloors);

      fd.append(
        "address",
        JSON.stringify({
          street: form.address.street,
          city: form.address.city,
          state: form.address.state,
          pincode: form.address.pincode,
          country: "India",
        })
      );

      // ⭐ append uploaded images if selected
      if (form.newImages) {
        [...form.newImages].forEach((file) => {
          fd.append("images", file);
        });
      }

      const res = await fetch(`http://localhost:5000/api/buildings/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      const data = await res.json();
      if (!data.data) {
        setError(data.message || "Update failed.");
        setUpdating(false);
        return;
      }

      navigate("/dashboard/my-buildings", {
        state: { message: "Building updated successfully!" },
      });
    } catch (err) {
      setError("Something went wrong.");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return <div className="eb-loading">Loading...</div>;

  return (
    <>
      <div className="eb-container">
        <div className="eb-header">
          <h1>Edit Building</h1>
          <p>Update your building details below</p>
        </div>

        {error && <p className="eb-error">{error}</p>}

        <form className="eb-form" onSubmit={handleSubmit}>
          {/* NAME */}
          <label className="eb-input">
            <FiHome />
            <input
              type="text"
              name="name"
              placeholder="Building Name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>

          {/* TYPE */}
          <label className="eb-input">
            <FiLayers />
            <select
              name="buildingType"
              value={form.buildingType}
              onChange={handleChange}
              required
            >
              <option value="">Select building type</option>
              <option value="residential">Residential</option>
              <option value="mixed_use">Mixed Use</option>
              <option value="hostel">Hostel</option>
              <option value="hotel">Hotel</option>
            </select>
          </label>

          {/* FLOORS */}
          <label className="eb-input">
            <FiHash />
            <input
              type="number"
              name="totalFloors"
              placeholder="Total Floors"
              value={form.totalFloors}
              onChange={handleChange}
              required
            />
          </label>

          {/* ADDRESS SECTION TITLE */}
          <h2 className="eb-sec-title">Address</h2>

          {/* STREET */}
          <label className="eb-input">
            <FiMapPin />
            <input
              type="text"
              name="address.street"
              placeholder="Street Address"
              value={form.address.street}
              onChange={handleChange}
              required
            />
          </label>

          {/* CITY */}
          <label className="eb-input">
            <FiMapPin />
            <input
              type="text"
              name="address.city"
              placeholder="City"
              value={form.address.city}
              onChange={handleChange}
              required
            />
          </label>

          {/* STATE */}
          <label className="eb-input">
            <FiMapPin />
            <input
              type="text"
              name="address.state"
              placeholder="State"
              value={form.address.state}
              onChange={handleChange}
              required
            />
          </label>

          {/* PINCODE */}
          <label className="eb-input">
            <FiMapPin />
            <input
              type="text"
              name="address.pincode"
              placeholder="Pincode"
              value={form.address.pincode}
              onChange={handleChange}
              required
            />
          </label>

          {/* EXISTING IMAGE PREVIEW */}
          {building?.images?.length > 0 && (
            <div className="eb-image-preview">
              <h3>Current Building Images</h3>
              <div className="eb-img-grid">
                {building.images.map((img, i) => (
                  <img key={i} src={img.url} alt="" />
                ))}
              </div>
            </div>
          )}
          {/* ⭐ ALWAYS SHOW IMAGE UPLOAD FIELD */}
          <div className="eb-input eb-image-upload">
            <FiImage />
            <input
              type="file"
              multiple
              accept="image/*"
              name="images"
              onChange={(e) => setForm({ ...form, newImages: e.target.files })}
            />
          </div>
          <p className="eb-hint">
            You can upload new building images (optional)
          </p>

          {/* ACTION BUTTONS */}
          <div className="eb-actions">
            <button
              type="button"
              className="eb-btn cancel"
              onClick={() => navigate("/dashboard/my-buildings")}
            >
              Cancel
            </button>

            <button type="submit" className="eb-btn primary">
              <FiEdit2 /> {updating ? "Updating..." : "Update Building"}
            </button>
          </div>
        </form>
      </div>

      <Footer />
    </>
  );
}
