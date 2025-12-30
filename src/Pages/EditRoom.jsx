import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
// import Navbar2 from "../Components/Navbar2";
import Footer from "../Components/Footer";
import {
  FiImage,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import "../Styles/EditRoom.css";

/**
 * Advanced EditRoom page (Option C)
 * - shows prefilled form
 * - existing images are shown, reorderable (drag), deletable
 * - new images can be drag-dropped or chosen via file input
 * - new images show live previews, reorderable (drag), deletable
 * - submitting sends FormData:
 *    - form fields as usual
 *    - new files appended as "images"
 *    - keepExisting: JSON string of existing image ids in final order
 *    - removedExisting: JSON string array of removed existing image ids
 *
 * Backend notes (expected):
 * - PUT /api/rooms/:id accepts multipart/form-data (upload.array("images"))
 * - backend can read keepExisting & removedExisting to handle existing images
 */
export default function EditRoom() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Hooks (always at top)
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverErrors, setServerErrors] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [form, setForm] = useState({
    title: "",
    description: "",
    roomType: "",
    capacity: "",
    floor: "",
    rentPerMonth: "",
    rentPerNight: "",
    securityDeposit: "",
    maintenanceCharge: "",
    furnishingStatus: "",
    amenities: "",
    sharedAmenities: "",
    bookingType: "",
    minimumStayValue: "",
    minimumStayUnit: "",
    allowPets: false,
    allowGuests: true,
    guestTimings: "",
    noOfGuestAllowed: "",
    preferredTenantType: "any",
    preferredGender: "any",
    availableFrom: "",
  });

  // Images handling
  // existingImages: array of { _id, url, publicId, ... } (orderable)
  const [existingImages, setExistingImages] = useState([]);
  const [removedExistingIds, setRemovedExistingIds] = useState([]); // ids removed by user

  // newFiles: array of File objects (orderable)
  const [newFiles, setNewFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]); // data URLs matching newFiles by index

  // Drag refs for reorder
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  // file input ref for click-trigger
  const fileInputRef = useRef(null);

  // fetch room, set form and existing images
  useEffect(() => {
    async function fetchRoom() {
      try {
        const res = await fetch(`http://localhost:5000/api/rooms/${id}`);
        const data = await res.json();
        if (!data.success) {
          setServerErrors(data.message || "Failed to load room");
          setLoading(false);
          return;
        }
        const r = data.data.room;
        setRoom(r);

        // populate form fields safely
        setForm({
          title: r.title || "",
          description: r.description || "",
          roomType: r.roomType || "",
          capacity: r.capacity || "",
          floor: r.floor ?? "",
          rentPerMonth: r.rentPerMonth ?? "",
          rentPerNight: r.rentPerNight ?? "",
          securityDeposit: r.securityDeposit ?? "",
          maintenanceCharge: r.maintenanceCharge ?? "",
          furnishingStatus: r.furnishingStatus || "",
          amenities: (r.amenities || []).join(","),
          sharedAmenities: (r.sharedAmenities || []).join(","),
          bookingType: r.bookingType || "monthly",
          minimumStayValue: r.minimumStay?.value || "",
          minimumStayUnit: r.minimumStay?.unit || "months",
          allowPets: r.rules?.allowPets || false,
          allowGuests: r.rules?.allowGuests ?? true,
          guestTimings: r.rules?.guestTimings || "",
          noOfGuestAllowed: r.rules?.noOfGuestAllowed || "",
          preferredTenantType:
            (r.preferredTenantType && r.preferredTenantType[0]) || "any",
          preferredGender: r.preferredGender || "any",
          availableFrom: r.availableFrom
            ? new Date(r.availableFrom).toISOString().slice(0, 10)
            : "",
        });

        // existing images array (copy)
        setExistingImages(r.images ? [...r.images] : []);
      } catch (err) {
        console.error(err);
        setServerErrors("Network error");
      } finally {
        setLoading(false);
      }
    }

    fetchRoom();
  }, [id]);

  // helpers
  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  }

  function parseCommaList(s) {
    return (s || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  // ----------  IMAGE UPLOAD / DRAG & DROP  ----------

  // handle dropped files or file input selection
  function handleFilesSelected(filesList) {
    const files = Array.from(filesList || []);
    if (files.length === 0) return;

    // append to newFiles and generate previews
    const nextFiles = [...newFiles, ...files];
    setNewFiles(nextFiles);

    // generate previews for newly added files
    const readers = files.map(
      (file) =>
        new Promise((res) => {
          const r = new FileReader();
          r.onload = (ev) => res(ev.target.result);
          r.readAsDataURL(file);
        })
    );

    Promise.all(readers).then((imgs) => {
      setNewPreviews((p) => [...p, ...imgs]);
    });
  }

  // drop handlers
  function handleDrop(e) {
    e.preventDefault();
    const dtFiles = e.dataTransfer.files;
    handleFilesSelected(dtFiles);
  }
  function handleDragOver(e) {
    e.preventDefault();
  }

  // remove existing image (mark for deletion)
  function removeExistingImage(imgId) {
    setExistingImages((prev) => prev.filter((i) => i._id !== imgId));
    setRemovedExistingIds((prev) => [...prev, imgId]);
  }

  // remove new file by index
  function removeNewFile(idx) {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
    setNewPreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  // reorder existing images via drag/drop
  function handleExistingDragStart(e, position) {
    dragItem.current = position;
  }
  function handleExistingDragEnter(e, position) {
    dragOverItem.current = position;
  }
  function handleExistingDrop() {
    const list = [...existingImages];
    const dragIndex = dragItem.current;
    const hoverIndex = dragOverItem.current;
    if (dragIndex === null || hoverIndex === null || dragIndex === hoverIndex) {
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }
    const item = list.splice(dragIndex, 1)[0];
    list.splice(hoverIndex, 0, item);
    dragItem.current = null;
    dragOverItem.current = null;
    setExistingImages(list);
  }

  // reorder new previews/files
  function handleNewDragStart(e, position) {
    dragItem.current = position;
  }
  function handleNewDragEnter(e, position) {
    dragOverItem.current = position;
  }
  function handleNewDrop() {
    const listFiles = [...newFiles];
    const listPreviews = [...newPreviews];
    const dragIndex = dragItem.current;
    const hoverIndex = dragOverItem.current;
    if (dragIndex === null || hoverIndex === null || dragIndex === hoverIndex) {
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }
    const fileItem = listFiles.splice(dragIndex, 1)[0];
    const previewItem = listPreviews.splice(dragIndex, 1)[0];
    listFiles.splice(hoverIndex, 0, fileItem);
    listPreviews.splice(hoverIndex, 0, previewItem);
    dragItem.current = null;
    dragOverItem.current = null;
    setNewFiles(listFiles);
    setNewPreviews(listPreviews);
  }

  // combined UX handlers: decide whether dragged item belongs to existing or new area by dataset
  // (we implemented separate handlers for existing and new lists in the markup)

  // ---------- SUBMIT ----------

  async function handleSubmit(e) {
    e.preventDefault();
    setServerErrors("");
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setServerErrors("You must be logged in");
        setSubmitting(false);
        return;
      }

      const fd = new FormData();

      // basic fields
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("roomType", form.roomType);
      fd.append("capacity", form.capacity);
      fd.append("floor", form.floor);

      fd.append("roomSize[value]", form.roomSizeValue || "");
      fd.append("roomSize[unit]", form.roomSizeUnit || "");

      fd.append("rentPerMonth", form.rentPerMonth);
      fd.append("rentPerNight", form.rentPerNight || "");
      fd.append("securityDeposit", form.securityDeposit || "");
      fd.append("maintenanceCharge", form.maintenanceCharge || "");

      fd.append("furnishingStatus", form.furnishingStatus || "");

      // amenities (send repeated)
      parseCommaList(form.amenities).forEach((a) => fd.append("amenities", a));
      parseCommaList(form.sharedAmenities).forEach((a) =>
        fd.append("sharedAmenities", a)
      );

      fd.append("bookingType", form.bookingType || "");
      fd.append("minimumStay[value]", form.minimumStayValue || "");
      fd.append("minimumStay[unit]", form.minimumStayUnit || "");

      fd.append("rules[allowPets]", form.allowPets ? "true" : "false");
      fd.append("rules[allowGuests]", form.allowGuests ? "true" : "false");
      if (form.guestTimings)
        fd.append("rules[guestTimings]", form.guestTimings);
      if (form.noOfGuestAllowed)
        fd.append("rules[noOfGuestAllowed]", form.noOfGuestAllowed);

      // preferred
      fd.append(
        "preferredTenantType",
        Array.isArray(form.preferredTenantType)
          ? form.preferredTenantType.join(",")
          : form.preferredTenantType
      );
      fd.append("preferredGender", form.preferredGender || "any");
      if (form.availableFrom) fd.append("availableFrom", form.availableFrom);

      // EXISTING IMAGES: keep order and send kept ids
      // keepExisting: JSON string array of existing image _id in final order
      const keepExisting = existingImages.map((img) => img._id);
      fd.append("keepExisting", JSON.stringify(keepExisting));

      // removedExisting: JSON string array of removed existing image ids (optional)
      fd.append("removedExisting", JSON.stringify(removedExistingIds));

      // NEW FILES: append as "images"
      newFiles.forEach((f) => fd.append("images", f));

      // Send PUT request
      const res = await fetch(`http://localhost:5000/api/rooms/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          // NOTE: do NOT set Content-Type — browser will set multipart boundary
        },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        // show server message
        setServerErrors(data.message || "Failed to update room");
        setSubmitting(false);
        return;
      }

      // success -> navigate to landlord rooms or room page
      navigate("/dashboard/my-rooms", {
        state: { message: "Room updated successfully" },
      });
    } catch (err) {
      console.error(err);
      setServerErrors("Network or server error");
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- RENDER ----------
  if (loading) return <div className="er-loading">Loading...</div>;
  if (!room)
    return (
      <div className="er-error">Room not found or you do not have access</div>
    );

  return (
    <>
      {/* <Navbar2 /> */}
      <div className="er-wrapper">
        <div className="er-card">
          <h2>Edit Room</h2>
          <p className="er-sub">Modify room details and manage images</p>

          {serverErrors && (
            <div className="er-server-error">{serverErrors}</div>
          )}

          <form
            className="er-form"
            onSubmit={handleSubmit}
            encType="multipart/form-data"
          >
            {/* Basic fields (title/desc) */}
            <label className="er-row">
              <span>Title</span>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
              />
            </label>

            <label className="er-row">
              <span>Description</span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="4"
                required
              />
            </label>

            <div className="er-grid-3">
              <label>
                Room Type
                <select
                  name="roomType"
                  value={form.roomType}
                  onChange={handleChange}
                >
                  <option value="">Select...</option>
                  <option value="single">single</option>
                  <option value="shared">shared</option>
                  <option value="pg">pg</option>
                  <option value="hostel">hostel</option>
                </select>
              </label>

              <label>
                Capacity
                <input
                  type="number"
                  name="capacity"
                  value={form.capacity}
                  onChange={handleChange}
                  min="1"
                />
              </label>

              <label>
                Floor
                <input
                  type="number"
                  name="floor"
                  value={form.floor}
                  onChange={handleChange}
                  min="0"
                />
              </label>
            </div>

            <div className="er-grid-3">
              <label>
                Rent / Month
                <input
                  type="number"
                  name="rentPerMonth"
                  value={form.rentPerMonth}
                  onChange={handleChange}
                  min="0"
                />
              </label>

              <label>
                Rent / Night
                <input
                  type="number"
                  name="rentPerNight"
                  value={form.rentPerNight}
                  onChange={handleChange}
                />
              </label>

              <label>
                Security Deposit
                <input
                  type="number"
                  name="securityDeposit"
                  value={form.securityDeposit}
                  onChange={handleChange}
                />
              </label>
            </div>

            <label className="er-row">
              <span>Furnishing Status</span>
              <select
                name="furnishingStatus"
                value={form.furnishingStatus}
                onChange={handleChange}
              >
                <option value="">Select...</option>
                <option value="unfurnished">Unfurnished</option>
                <option value="semi_furnished">Semi Furnished</option>
                <option value="fully_furnished">Fully Furnished</option>
              </select>
            </label>

            {/* AMENITIES (comma) */}
            <label className="er-row">
              <span>Amenities (comma-separated)</span>
              <input
                name="amenities"
                value={form.amenities}
                onChange={handleChange}
                placeholder="bed,desk,fan..."
              />
            </label>

            <label className="er-row">
              <span>Shared Amenities (comma-separated)</span>
              <input
                name="sharedAmenities"
                value={form.sharedAmenities}
                onChange={handleChange}
                placeholder="kitchen,parking..."
              />
            </label>

            {/* IMAGE MANAGEMENT: Existing + New */}
            <div className="er-section">
              <h3>Images</h3>
              <p className="er-hint">
                Drag to reorder. Delete single images. Add new images (drag &
                drop or click).
              </p>

              {/* EXISTING IMAGES */}
              <div className="er-subsection">
                <h4>Existing images</h4>
                {existingImages.length === 0 ? (
                  <p className="er-muted">No existing images.</p>
                ) : (
                  <div className="er-images-grid">
                    {existingImages.map((img, idx) => (
                      <div
                        className="er-image-item"
                        key={img._id}
                        draggable
                        onDragStart={(e) => handleExistingDragStart(e, idx)}
                        onDragEnter={(e) => handleExistingDragEnter(e, idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDragEnd={handleExistingDrop}
                        onDrop={handleExistingDrop}
                      >
                        <img src={img.url} alt={`img-${idx}`} />
                        <button
                          type="button"
                          className="er-img-delete"
                          onClick={() => removeExistingImage(img._id)}
                        >
                          <FiTrash2 />
                        </button>
                        <div className="er-img-order">{idx + 1}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* NEW FILES */}
              <div className="er-subsection">
                <h4>New images (will be uploaded)</h4>

                <div
                  className="er-dropzone"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="er-drop-inner">
                    <FiImage size={28} />
                    <div>Drop images here or click to choose</div>
                    <small>
                      Max 10 images. Common formats: jpg, png, webp.
                    </small>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFilesSelected(e.target.files)}
                    style={{ display: "none" }}
                  />
                </div>

                {newPreviews.length > 0 && (
                  <div className="er-images-grid">
                    {newPreviews.map((src, idx) => (
                      <div
                        className="er-image-item"
                        key={idx}
                        draggable
                        onDragStart={(e) => handleNewDragStart(e, idx)}
                        onDragEnter={(e) => handleNewDragEnter(e, idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDragEnd={handleNewDrop}
                        onDrop={handleNewDrop}
                      >
                        <img src={src} alt={`preview-${idx}`} />
                        <button
                          type="button"
                          className="er-img-delete"
                          onClick={() => removeNewFile(idx)}
                        >
                          <FiTrash2 />
                        </button>
                        <div className="er-img-order">{idx + 1}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="er-actions">
              <button
                type="submit"
                className="er-btn primary"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="er-btn ghost"
                onClick={() => navigate("/dashboard/my-rooms")}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </>
  );
}
