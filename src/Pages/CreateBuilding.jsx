import React, { useState, useRef } from "react";
import "../Styles/CreateBuilding.css";
import LocationPicker from "../Components/LocationPicker";
import { geocodeAddress } from "../Utils/geocode";

export default function CreateBuilding() {
  const [form, setForm] = useState({
    name: "",
    buildingType: "residential",
    totalFloors: "",
    totalRooms: "",
    yearBuilt: "",
    description: "",
    // address fields handled separately
    address_street: "",
    address_city: "",
    address_state: "",
    address_pincode: "",
    address_country: "India",
    amenities: [], // array of strings
    contactNumbers: [], // array of strings
    rules_allowPets: false,
    rules_allowGuests: true,
    rules_visitorTimings: "",
    rules_guestPolicy: "",
    rules_other: [], // array
  });

  const [amenityInput, setAmenityInput] = useState("");
  const [contactInput, setContactInput] = useState("");
  const [ruleOtherInput, setRuleOtherInput] = useState("");
  const [images, setImages] = useState([]); // File objects
  const [imagePreviews, setImagePreviews] = useState([]); // data URLs
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [location, setLocation] = useState({
    lat: 34.0836,
    lng: 74.7973,
  });

  const fileInputRef = useRef();

  // Basic client-side validation consistent with model/controller
  function validate() {
    if (!form.name || form.name.trim().length < 3) {
      return "Building name is required and must be at least 3 characters.";
    }
    if (!form.address_street || !form.address_city || !form.address_state) {
      return "Street, city and state are required.";
    }
    if (!/^\d{6}$/.test(form.address_pincode)) {
      return "Pincode must be a 6-digit number.";
    }
    if (!form.totalFloors || Number(form.totalFloors) < 1) {
      return "Total floors is required and must be >= 1.";
    }
    return null;
  }

  function handleInput(e) {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm((s) => ({ ...s, [name]: checked }));
    } else {
      setForm((s) => ({ ...s, [name]: value }));
    }
  }

  function addAmenity() {
    const v = amenityInput.trim();
    if (!v) return;
    setForm((s) => ({ ...s, amenities: [...s.amenities, v] }));
    setAmenityInput("");
  }

  function removeAmenity(idx) {
    setForm((s) => ({
      ...s,
      amenities: s.amenities.filter((_, i) => i !== idx),
    }));
  }

  function addContact() {
    const v = contactInput.trim();
    if (!v) return;
    setForm((s) => ({ ...s, contactNumbers: [...s.contactNumbers, v] }));
    setContactInput("");
  }

  function removeContact(idx) {
    setForm((s) => ({
      ...s,
      contactNumbers: s.contactNumbers.filter((_, i) => i !== idx),
    }));
  }

  function addRuleOther() {
    const v = ruleOtherInput.trim();
    if (!v) return;
    setForm((s) => ({ ...s, rules_other: [...s.rules_other, v] }));
    setRuleOtherInput("");
  }

  function removeRuleOther(idx) {
    setForm((s) => ({
      ...s,
      rules_other: s.rules_other.filter((_, i) => i !== idx),
    }));
  }

  function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // append to existing
    const newFiles = [...images, ...files].slice(0, 10); // backend accepts up to 10
    setImages(newFiles);

    // generate previews for UI
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews((prev) => {
          // avoid duplicates (by name + size)
          const exists = prev.some(
            (p) => p.name === file.name && p.size === file.size
          );
          if (exists) return prev;
          return [
            ...prev,
            { src: ev.target.result, name: file.name, size: file.size },
          ];
        });
      };
      reader.readAsDataURL(file);
    });

    // reset file input UI
    if (fileInputRef.current) fileInputRef.current.value = null;
  }

  function removeImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError(null);
    setSuccessMsg(null);

    const clientErr = validate();
    if (clientErr) {
      setServerError(clientErr);
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();

      // Simple fields
      fd.append("name", form.name);
      fd.append("buildingType", form.buildingType);
      if (form.totalFloors) fd.append("totalFloors", form.totalFloors);
      if (form.totalRooms) fd.append("totalRooms", form.totalRooms);
      if (form.yearBuilt) fd.append("yearBuilt", form.yearBuilt);
      if (form.description) fd.append("description", form.description);

      // Address nested fields (backend controller expects address[street] etc.)
      fd.append("address[street]", form.address_street);
      fd.append("address[city]", form.address_city);
      fd.append("address[state]", form.address_state);
      fd.append("address[pincode]", form.address_pincode);
      fd.append("address[country]", form.address_country || "India");

      // Amenities: append each as repeated key => controller normalizeToArray will accept
      if (form.amenities.length > 0) {
        form.amenities.forEach((a) => fd.append("amenities", a));
      }

      // ContactNumbers
      if (form.contactNumbers.length > 0) {
        form.contactNumbers.forEach((c) => fd.append("contactNumbers", c));
      }

      // Rules: follow backend keys
      fd.append("rules[allowPets]", form.rules_allowPets ? "true" : "false");
      fd.append(
        "rules[allowGuests]",
        form.rules_allowGuests ? "true" : "false"
      );
      if (form.rules_visitorTimings)
        fd.append("rules[visitorTimings]", form.rules_visitorTimings);
      if (form.rules_guestPolicy)
        fd.append("rules[guestPolicy]", form.rules_guestPolicy);

      if (form.rules_other.length > 0) {
        form.rules_other.forEach((r) => fd.append("rules[other]", r));
      }

      // Images: backend expects files via upload.array("images")
      images.forEach((file) => fd.append("images", file));
      // 📍 Location (GeoJSON Point) — CRITICAL
      fd.append(
        "location",
        JSON.stringify({
          type: "Point",
          coordinates: [location.lng, location.lat],
        })
      );

      // Auth token from localStorage (you were storing token there)
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/buildings", {
        method: "POST",
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        // API sends ApiError/ApiResponse; try to extract message
        const message =
          (data &&
            (data.message || data.error || data?.errors?.[0]?.message)) ||
          data?.data ||
          "Failed to create building";
        throw new Error(message);
      }

      setSuccessMsg("Building created successfully.");
      // Optionally reset form
      setForm({
        name: "",
        buildingType: "residential",
        totalFloors: "",
        totalRooms: "",
        yearBuilt: "",
        description: "",
        address_street: "",
        address_city: "",
        address_state: "",
        address_pincode: "",
        address_country: "India",
        amenities: [],
        contactNumbers: [],
        rules_allowPets: false,
        rules_allowGuests: true,
        rules_visitorTimings: "",
        rules_guestPolicy: "",
        rules_other: [],
      });
      setImages([]);
      setImagePreviews([]);
      setLocation({
        lat: 34.0836,
        lng: 74.7973,
      });
    } catch (err) {
      setServerError(err.message || "Server error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cb-container">
      <form
        className="cb-form"
        onSubmit={handleSubmit}
        encType="multipart/form-data"
      >
        <h2 className="cb-title">Add a New Building</h2>
        <p className="cb-subtitle">
          Fill the details below to list your property
        </p>

        {serverError && <div className="cb-alert error">{serverError}</div>}
        {successMsg && <div className="cb-alert success">{successMsg}</div>}

        {/* BASIC INFO */}
        <section className="cb-section">
          <h3 className="cb-section-title">Basic Information</h3>

          <div className="cb-grid-2">
            <label className="cb-field">
              <span>Building Name *</span>
              <input name="name" value={form.name} onChange={handleInput} />
            </label>

            <label className="cb-field">
              <span>Type *</span>
              <select
                name="buildingType"
                value={form.buildingType}
                onChange={handleInput}
              >
                <option value="residential">Residential</option>
                <option value="mixed_use">Mixed use</option>
                <option value="hostel">Hostel</option>
                <option value="hotel">Hotel</option>
                <option value="pg">PG</option>
              </select>
            </label>
          </div>

          <div className="cb-grid-2">
            <label className="cb-field">
              <span>Total Floors *</span>
              <input
                name="totalFloors"
                type="number"
                min="1"
                value={form.totalFloors}
                onChange={handleInput}
              />
            </label>

            <label className="cb-field">
              <span>Total Rooms</span>
              <input
                name="totalRooms"
                type="number"
                min="1"
                value={form.totalRooms}
                onChange={handleInput}
              />
            </label>
          </div>

          <label className="cb-field">
            <span>Year Built</span>
            <input
              name="yearBuilt"
              type="number"
              min="1900"
              max="2100"
              value={form.yearBuilt}
              onChange={handleInput}
            />
          </label>

          <label className="cb-field">
            <span>Description</span>
            <textarea
              name="description"
              value={form.description}
              onChange={handleInput}
              rows="4"
            />
          </label>
        </section>

        {/* ADDRESS */}
        <section className="cb-section">
          <h3 className="cb-section-title">Address *</h3>

          <label className="cb-field">
            <span>Street</span>
            <input
              name="address_street"
              value={form.address_street}
              onChange={handleInput}
              onBlur={async () => {
                if (
                  !form.address_street ||
                  !form.address_city ||
                  !form.address_state ||
                  !form.address_pincode
                ) {
                  return;
                }

                const fullAddress = `${form.address_street}, ${form.address_city}, ${form.address_state}, ${form.address_pincode}, India`;

                const coords = await geocodeAddress(fullAddress);
                if (coords) setLocation(coords);
              }}
            />
          </label>

          <div className="cb-grid-3">
            <label className="cb-field">
              <span>City</span>
              <input
                name="address_city"
                value={form.address_city}
                onChange={handleInput}
              />
            </label>

            <label className="cb-field">
              <span>State</span>
              <input
                name="address_state"
                value={form.address_state}
                onChange={handleInput}
              />
            </label>

            <label className="cb-field">
              <span>Pincode</span>
              <input
                name="address_pincode"
                value={form.address_pincode}
                onChange={handleInput}
              />
            </label>
          </div>
        </section>
        {/* LOCATION MAP */}
        <section className="cb-section">
          <h3 className="cb-section-title">Confirm Location</h3>
          <p className="cb-muted">
            Drag the pin to adjust the exact building location
          </p>

          <LocationPicker position={location} onChange={setLocation} />
        </section>

        {/* AMENITIES */}
        <section className="cb-section">
          <h3 className="cb-section-title">Amenities</h3>

          <div className="cb-input-row">
            <input
              className="cb-input"
              value={amenityInput}
              onChange={(e) => setAmenityInput(e.target.value)}
              placeholder="e.g. WiFi, Parking"
            />
            <button
              type="button"
              className="cb-btn-secondary"
              onClick={addAmenity}
            >
              Add
            </button>
          </div>

          <div className="cb-tags">
            {form.amenities.map((a, i) => (
              <span key={i} className="cb-tag">
                {a}
                <button type="button" onClick={() => removeAmenity(i)}>
                  ×
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* CONTACT NUMBERS */}
        <section className="cb-section">
          <h3 className="cb-section-title">Contact Numbers</h3>

          <div className="cb-input-row">
            <input
              className="cb-input"
              value={contactInput}
              onChange={(e) => setContactInput(e.target.value)}
              placeholder="e.g. +91 99999 00000"
            />
            <button
              type="button"
              className="cb-btn-secondary"
              onClick={addContact}
            >
              Add
            </button>
          </div>

          <div className="cb-tags">
            {form.contactNumbers.map((c, i) => (
              <span key={i} className="cb-tag">
                {c}
                <button type="button" onClick={() => removeContact(i)}>
                  ×
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* RULES */}
        <section className="cb-section">
          <h3 className="cb-section-title">Rules</h3>

          <div className="cb-checkbox-row">
            <label>
              <input
                type="checkbox"
                name="rules_allowPets"
                checked={form.rules_allowPets}
                onChange={handleInput}
              />
              Allow Pets
            </label>

            <label>
              <input
                type="checkbox"
                name="rules_allowGuests"
                checked={form.rules_allowGuests}
                onChange={handleInput}
              />
              Allow Guests
            </label>
          </div>

          <label className="cb-field">
            <span>Visitor Timings</span>
            <input
              name="rules_visitorTimings"
              value={form.rules_visitorTimings}
              onChange={handleInput}
            />
          </label>

          <label className="cb-field">
            <span>Guest Policy</span>
            <input
              name="rules_guestPolicy"
              value={form.rules_guestPolicy}
              onChange={handleInput}
            />
          </label>

          <div className="cb-input-row">
            <input
              value={ruleOtherInput}
              onChange={(e) => setRuleOtherInput(e.target.value)}
              placeholder="Other rule"
            />
            <button
              type="button"
              className="cb-btn-secondary"
              onClick={addRuleOther}
            >
              Add
            </button>
          </div>

          <div className="cb-tags">
            {form.rules_other.map((r, i) => (
              <span key={i} className="cb-tag">
                {r}
                <button type="button" onClick={() => removeRuleOther(i)}>
                  ×
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* IMAGES */}
        <section className="cb-section">
          <h3 className="cb-section-title">Images (max 10)</h3>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            className="cb-file-input"
          />

          <div className="cb-image-grid">
            {imagePreviews.map((p, i) => (
              <div key={i} className="cb-img-card">
                <img src={p.src} alt={p.name} />
                <button
                  type="button"
                  className="cb-remove-img"
                  onClick={() => removeImage(i)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="cb-submit-wrap">
          <button type="submit" className="cb-btn-primary" disabled={loading}>
            {loading ? "Submitting..." : "Create Building"}
          </button>
        </div>
      </form>
    </div>
  );
}
