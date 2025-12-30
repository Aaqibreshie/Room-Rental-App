// src/Pages/CreateRoom.jsx
import { useEffect, useState } from "react";
import "../Styles/CreateRoom.css";
import Toast from "../Components/Toast.jsx";
import Footer from "../Components/Footer";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * CreateRoom - frontend form that matches backend expectations
 * - Sends nested keys like roomSize[value], minimumStay[value], rules[...]
 * - Sends repeated keys for amenities/sharedAmenities
 * - Posts FormData with Authorization header
 *
 * Backend references:
 * - Controller expects nested keys & repeated amenities. :contentReference[oaicite:9]{index=9}
 * - Room schema enumerations & name expectations. :contentReference[oaicite:10]{index=10}
 * - Validators require specific fields (title, description, roomType, etc.). :contentReference[oaicite:11]{index=11}
 */

const ROOM_AMENITIES = [
  "bed",
  "mattress",
  "pillow",
  "cupboard",
  "desk",
  "chair",
  "fan",
  "ac",
  "heater",
  "lights",
  "curtains",
  "carpet",
  "bathroom",
  "attached_bathroom",
  "hot_water",
  "balcony",
  "window",
];

const SHARED_AMENITIES = [
  "kitchen",
  "dining_area",
  "living_room",
  "common_tv",
  "laundry",
  "internet",
  "parking",
  "garden",
  "security_guard",
];

const ROOM_TYPES = ["single", "shared", "pg", "hostel"];
const FURNISHING = ["unfurnished", "semi_furnished", "fully_furnished"];
const BOOKING_TYPES = ["monthly", "nightly", "both"];
const MIN_STAY_UNITS = ["days", "months"];
const ROOM_UNITS = ["sqft", "sqm"];
const TENANT_TYPES = ["any", "student", "working_professional"];
const GENDERS = ["any", "male", "female"];

export default function CreateRoom() {
  const navigate = useNavigate();
  const location = useLocation();

  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [buildingAmenities, setBuildingAmenities] = useState([]);

  const [images, setImages] = useState([]); // File objects
  const [preview, setPreview] = useState([]); // data-URIs

  const [serverErrors, setServerErrors] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "" });

  const [form, setForm] = useState({
    roomNumber: "",
    title: "",
    description: "",
    roomType: "",
    capacity: "",
    floor: "",
    roomSizeValue: "",
    roomSizeUnit: "sqft",
    rentPerMonth: "",
    rentPerNight: "",
    securityDeposit: "",
    maintenanceCharge: "",
    furnishingStatus: "",
    // We keep amenities as comma string (for manual entry) but also expose checkbox lists
    amenities: "",
    sharedAmenities: "",
    bookingType: "monthly",
    minimumStayValue: "",
    minimumStayUnit: "months",
    allowPets: false,
    allowGuests: true,
    guestTimings: "",
    noOfGuestAllowed: "",
    preferredTenantType: "any",
    preferredGender: "any",
    availableFrom: "",
  });

  // helper to set form fields
  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  // toggle amenity checkboxes (room-level)
  function toggleAmenity(a) {
    // maintain as set in string (comma separated) but also allow quick selection
    const arr = (form.amenities || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const has = arr.includes(a);
    const next = has ? arr.filter((x) => x !== a) : [...arr, a];
    setForm((p) => ({ ...p, amenities: next.join(",") }));
  }

  // toggle shared amenity
  function toggleSharedAmenity(a) {
    const arr = (form.sharedAmenities || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const has = arr.includes(a);
    const next = has ? arr.filter((x) => x !== a) : [...arr, a];
    setForm((p) => ({ ...p, sharedAmenities: next.join(",") }));
  }

  // preselect building from query param (if provided)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const buildingFromURL = params.get("building");
    if (buildingFromURL) setSelectedBuilding(buildingFromURL);
  }, [location]);

  // fetch landlord's buildings and auto-select if url had building
  useEffect(() => {
    async function fetchBuildings() {
      try {
        const res = await fetch(
          "http://localhost:5000/api/buildings/my-buildings",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = await res.json();
        if (data.success) {
          setBuildings(data.data || []);

          // if building ID present in URL, set buildingAmenities
          const params = new URLSearchParams(window.location.search);
          const buildingFromURL = params.get("building");
          if (buildingFromURL) {
            const b = data.data.find((x) => x._id === buildingFromURL);
            if (b) {
              setSelectedBuilding(buildingFromURL);
              setBuildingAmenities(b.amenities || []);
            }
          }
        } else {
          // unauthorized or other error
          setServerErrors(data.message || "Failed to load buildings");
        }
      } catch (err) {
        console.error(err);
        setServerErrors("Failed to load buildings");
      }
    }
    fetchBuildings();
  }, []);

  // when building selector changed, update amenities
  function handleBuildingChange(e) {
    const buildingId = e.target.value;
    setSelectedBuilding(buildingId);
    const b = buildings.find((x) => x._id === buildingId);
    setBuildingAmenities(b?.amenities || []);
  }

  // images
  function handleImageChange(e) {
    const files = Array.from(e.target.files || []);
    setImages(files);
    setPreview(files.map((f) => URL.createObjectURL(f)));
  }

  function removePreview(idx) {
    setPreview((p) => p.filter((_, i) => i !== idx));
    setImages((p) => p.filter((_, i) => i !== idx));
  }

  // helper to parse comma string into array safely
  const parseCommaList = (s) =>
    (s || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

  function showToast(message, duration = 2500) {
    setToast({ show: true, message });

    setTimeout(() => {
      setToast({ show: false, message: "" });
    }, duration);
  }

  // submit handler
  async function handleSubmit(e) {
    e.preventDefault();
    setServerErrors(null);

    // basic front-end validation to avoid immediate backend error
    const missing = [];
    if (!form.title || form.title.trim().length < 5)
      missing.push("Title (min 5 chars)");
    if (!form.description || form.description.trim().length < 10)
      missing.push("Description");
    if (!ROOM_TYPES.includes(form.roomType)) missing.push("Room type");
    if (!form.capacity || Number(form.capacity) < 1) missing.push("Capacity");
    if (form.floor === "" || Number(form.floor) < 0) missing.push("Floor");
    if (!form.rentPerMonth || Number(form.rentPerMonth) < 0)
      missing.push("Rent per month");
    if (!form.securityDeposit || Number(form.securityDeposit) < 0)
      missing.push("Security deposit");
    if (!FURNISHING.includes(form.furnishingStatus))
      missing.push("Furnishing status");
    if (!selectedBuilding) missing.push("Building (select one)");

    if (missing.length > 0) {
      setServerErrors("Please fix: " + missing.join(", "));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // build FormData matching backend keys exactly
    const fd = new FormData();
    fd.append("building", selectedBuilding);
    fd.append("roomNumber", form.roomNumber);
    fd.append("title", form.title);
    fd.append("description", form.description);
    fd.append("roomType", form.roomType);
    fd.append("capacity", form.capacity);
    fd.append("floor", form.floor);

    fd.append("roomSize[value]", form.roomSizeValue || "");
    fd.append("roomSize[unit]", form.roomSizeUnit || "");

    fd.append("rentPerMonth", form.rentPerMonth || "");
    fd.append("rentPerNight", form.rentPerNight || "");
    fd.append("securityDeposit", form.securityDeposit || "");
    fd.append("maintenanceCharge", form.maintenanceCharge || "");

    fd.append("furnishingStatus", form.furnishingStatus);

    // amenities: send as repeated keys (backend normalizeToArray accepts array or comma string)
    parseCommaList(form.amenities).forEach((a) => fd.append("amenities", a));
    parseCommaList(form.sharedAmenities).forEach((a) =>
      fd.append("sharedAmenities", a)
    );

    fd.append("bookingType", form.bookingType || "");
    fd.append("minimumStay[value]", form.minimumStayValue || "");
    fd.append("minimumStay[unit]", form.minimumStayUnit || "");

    fd.append("rules[allowPets]", form.allowPets ? "true" : "false");
    fd.append("rules[allowGuests]", form.allowGuests ? "true" : "false");
    if (form.guestTimings) fd.append("rules[guestTimings]", form.guestTimings);
    if (form.noOfGuestAllowed)
      fd.append("rules[noOfGuestAllowed]", form.noOfGuestAllowed);

    // preferred types -> send repeated keys
    const preferred = Array.isArray(form.preferredTenantType)
      ? form.preferredTenantType
      : [form.preferredTenantType];
    preferred
      .filter(Boolean)
      .forEach((p) => fd.append("preferredTenantType", p));

    fd.append("preferredGender", form.preferredGender || "any");
    if (form.availableFrom) fd.append("availableFrom", form.availableFrom);

    // images
    images.forEach((f) => fd.append("images", f));

    // POST
    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:5000/api/rooms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // success
        showToast("Room created successfully");

        setTimeout(() => {
          navigate("/dashboard");
        }, 800);
      } else {
        const msg = data.message || "Failed to create room";

        setServerErrors(msg); // ← shows red error box
        showToast(msg); // ← shows toast

        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      console.error(err);
      setServerErrors("Network error - failed to create room");
      showToast("Network error - failed to create room");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* <Navbar /> */}
      <div className="create-room-page">
        <div className="create-room-card">
          <h2>Add a Room</h2>

          {serverErrors && <div className="cr-error">{serverErrors}</div>}

          <form
            onSubmit={handleSubmit}
            className="cr-form"
            encType="multipart/form-data"
          >
            {/* BUILDING SELECT */}
            <label className="cr-label">
              Building *
              <select
                value={selectedBuilding}
                onChange={handleBuildingChange}
                required
              >
                <option value="">Select building...</option>
                {buildings.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} — {b.address?.city || "—"}
                  </option>
                ))}
              </select>
            </label>

            {/* building amenities preview */}
            {buildingAmenities.length > 0 && (
              <div className="cr-building-amenities">
                <strong>Building amenities:</strong>
                <div className="cr-amenities-list">
                  {buildingAmenities.map((a) => (
                    <span key={a} className="cr-chip">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="cr-row">
              <label className="cr-label">
                Room Number
                <input
                  name="roomNumber"
                  value={form.roomNumber}
                  onChange={handleChange}
                  placeholder="e.g. 101A"
                />
              </label>

              <label className="cr-label">
                Capacity *
                <input
                  name="capacity"
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <label className="cr-label">
              Title * (min 5 chars)
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
              />
            </label>

            <label className="cr-label">
              Description *
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="4"
                required
              />
            </label>

            <div className="cr-row">
              <label className="cr-label">
                Room Type *
                <select
                  name="roomType"
                  value={form.roomType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select...</option>
                  {ROOM_TYPES.map((rt) => (
                    <option key={rt} value={rt}>
                      {rt}
                    </option>
                  ))}
                </select>
              </label>

              <label className="cr-label">
                Floor *
                <input
                  name="floor"
                  type="number"
                  min="0"
                  value={form.floor}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <div className="cr-row">
              <label className="cr-label">
                Room Size
                <input
                  name="roomSizeValue"
                  type="number"
                  min="0"
                  value={form.roomSizeValue}
                  onChange={handleChange}
                />
              </label>

              <label className="cr-label">
                Unit
                <select
                  name="roomSizeUnit"
                  value={form.roomSizeUnit}
                  onChange={handleChange}
                >
                  {ROOM_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="cr-row">
              <label className="cr-label">
                Rent / Month *
                <input
                  name="rentPerMonth"
                  type="number"
                  min="0"
                  value={form.rentPerMonth}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="cr-label">
                Rent / Night
                <input
                  name="rentPerNight"
                  type="number"
                  min="0"
                  value={form.rentPerNight}
                  onChange={handleChange}
                />
              </label>
            </div>

            <div className="cr-row">
              <label className="cr-label">
                Security Deposit *
                <input
                  name="securityDeposit"
                  type="number"
                  min="0"
                  value={form.securityDeposit}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="cr-label">
                Maintenance
                <input
                  name="maintenanceCharge"
                  type="number"
                  min="0"
                  value={form.maintenanceCharge}
                  onChange={handleChange}
                />
              </label>
            </div>

            <label className="cr-label">
              Furnishing Status *
              <select
                name="furnishingStatus"
                value={form.furnishingStatus}
                onChange={handleChange}
                required
              >
                <option value="">Select...</option>
                {FURNISHING.map((f) => (
                  <option key={f} value={f}>
                    {f.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>

            {/* Amenities checklists (helps produce valid enums) */}
            <div className="cr-section">
              <strong>Room amenities (click to toggle)</strong>
              <div className="cr-amenities-grid">
                {ROOM_AMENITIES.map((a) => {
                  const selected = parseCommaList(form.amenities).includes(a);
                  return (
                    <button
                      type="button"
                      key={a}
                      className={`cr-chip ${selected ? "selected" : ""}`}
                      onClick={() => toggleAmenity(a)}
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
              <small className="muted">
                You can also type comma-separated values below.
              </small>
              <input
                name="amenities"
                value={form.amenities}
                onChange={handleChange}
                placeholder="bed,desk,fan..."
              />
            </div>

            <div className="cr-section">
              <strong>Shared amenities</strong>
              <div className="cr-amenities-grid">
                {SHARED_AMENITIES.map((a) => {
                  const selected = parseCommaList(
                    form.sharedAmenities
                  ).includes(a);
                  return (
                    <button
                      type="button"
                      key={a}
                      className={`cr-chip ${selected ? "selected" : ""}`}
                      onClick={() => toggleSharedAmenity(a)}
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
              <input
                name="sharedAmenities"
                value={form.sharedAmenities}
                onChange={handleChange}
                placeholder="kitchen,parking..."
              />
            </div>

            <div className="cr-row">
              <label className="cr-label">
                Booking Type
                <select
                  name="bookingType"
                  value={form.bookingType}
                  onChange={handleChange}
                >
                  <option value="">Select...</option>
                  {BOOKING_TYPES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>

              <label className="cr-label">
                Minimum stay
                <input
                  type="number"
                  name="minimumStayValue"
                  value={form.minimumStayValue}
                  onChange={handleChange}
                />
                <select
                  name="minimumStayUnit"
                  value={form.minimumStayUnit}
                  onChange={handleChange}
                >
                  {MIN_STAY_UNITS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Rules */}
            <div className="cr-section">
              <strong>Rules</strong>
              <label className="inline">
                <input
                  name="allowPets"
                  type="checkbox"
                  checked={form.allowPets}
                  onChange={handleChange}
                />{" "}
                Allow pets
              </label>
              <label className="inline">
                <input
                  name="allowGuests"
                  type="checkbox"
                  checked={form.allowGuests}
                  onChange={handleChange}
                />{" "}
                Allow guests
              </label>
              <label>
                Guest timings
                <input
                  name="guestTimings"
                  value={form.guestTimings}
                  onChange={handleChange}
                />
              </label>
              <label>
                Guests allowed (#)
                <input
                  name="noOfGuestAllowed"
                  type="number"
                  min="0"
                  value={form.noOfGuestAllowed}
                  onChange={handleChange}
                />
              </label>
            </div>

            {/* preferences */}
            <div className="cr-row">
              <label className="cr-label">
                Preferred tenant type
                <select
                  name="preferredTenantType"
                  value={form.preferredTenantType}
                  onChange={handleChange}
                >
                  {TENANT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </label>

              <label className="cr-label">
                Preferred gender
                <select
                  name="preferredGender"
                  value={form.preferredGender}
                  onChange={handleChange}
                >
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Available from
              <input
                type="date"
                name="availableFrom"
                value={form.availableFrom}
                onChange={handleChange}
              />
            </label>

            <label className="cr-label">
              Upload images (required)
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                required
              />
            </label>

            {preview.length > 0 && (
              <div className="cr-preview-grid">
                {preview.map((src, i) => (
                  <div key={i} className="cr-preview-item">
                    <img src={src} alt={`preview-${i}`} />
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removePreview(i)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="cr-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Create Room"}
              </button>

              <button
                type="button"
                className="btn-ghost"
                onClick={() => navigate("/my-rooms")}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
      <Toast show={toast.show} message={toast.message} />
      <Footer />
    </>
  );
}
