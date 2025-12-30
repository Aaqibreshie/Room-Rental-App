import Building from "../models/Building.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import cloudinary from "../config/cloudinary.js";

async function geocodeAddress(address) {
  console.log("GEOCODING ADDRESS =>", address);
  // console.log("🧭 GEOCODING INPUT ADDRESS:", address);

  const baseUrl = "https://nominatim.openstreetmap.org/search";
  const headers = {
    "User-Agent": "room-rental-app/1.0 (contact@roomrental.local)",
    Accept: "application/json",
  };

  // 🔹 1️⃣ Try FULL structured search
  // 🔹 1️⃣ Try FULL structured search (WITH LANDMARK SUPPORT)
  const streetQuery = address.landmark
    ? `${address.street}, ${address.landmark}`
    : address.street;

  let url =
    `${baseUrl}?` +
    `street=${encodeURIComponent(streetQuery)}` +
    `&city=${encodeURIComponent(address.city)}` +
    `&state=${encodeURIComponent(address.state)}` +
    `&postalcode=${encodeURIComponent(address.pincode)}` +
    `&country=India` +
    `&countrycodes=in` +
    `&format=json&limit=1`;

  let res = await fetch(url, { headers });
  let data = await res.json();

  console.log("GEOCODE TRY 1 =>", data.length);

  // 🔹 2️⃣ Fallback: CITY + STATE + PINCODE
  if (!data.length) {
    url =
      `${baseUrl}?` +
      `city=${encodeURIComponent(address.city)}` +
      `&state=${encodeURIComponent(address.state)}` +
      `&postalcode=${encodeURIComponent(address.pincode)}` +
      `&country=India` +
      `&countrycodes=in` +
      `&format=json&limit=1`;

    res = await fetch(url, { headers });
    data = await res.json();

    console.log("GEOCODE TRY 2 =>", data.length);
  }

  // 🔹 3️⃣ Final fallback: CITY + STATE
  // if (!data.length) {
  //   url =
  //     `${baseUrl}?` +
  //     `city=${encodeURIComponent(address.city)}` +
  //     `&state=${encodeURIComponent(address.state)}` +
  //     `&country=India` +
  //     `&countrycodes=in` +
  //     `&format=json&limit=1`;

  //   res = await fetch(url, { headers });
  //   data = await res.json();

  //   console.log("GEOCODE TRY 3 =>", data.length);
  // }

  if (!data.length) {
    throw new ApiError(
      "Unable to geocode address. Please provide a more specific location.",
      400
    );
  }
  console.log("📍 FINAL GEO RESULT:", {
    lat: data[0].lat,
    lng: data[0].lon,
    displayName: data[0].display_name,
  });

  return {
    lat: Number(data[0].lat),
    lng: Number(data[0].lon),
  };
}

/**
 * Utility: normalize to array
 * Accepts arrays, comma-separated strings, single values, undefined -> returns array
 */
const normalizeToArray = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === "string" && v.includes(","))
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  return [v];
};

/**
 * Get All Buildings (Public)
 * Supports: page, limit, city
 */
export const getAllBuildings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, city, owner } = req.query;

  const filter = { isActive: true };

  if (city) {
    // case-insensitive match
    filter["address.city"] = { $regex: new RegExp(`^${city}$`, "i") };
  }

  if (owner) {
    filter.owner = owner;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const buildings = await Building.find(filter)
    .populate("owner", "fullName email phone profilePicture")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Building.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        buildings,
        pagination: {
          total,
          pages: Math.ceil(total / Number(limit)),
          currentPage: Number(page),
        },
      },
      "Buildings retrieved successfully"
    )
  );
});

/**
 * Get Building by ID
 */
export const getBuildingById = asyncHandler(async (req, res) => {
  const building = await Building.findById(req.params.id).populate(
    "owner",
    "fullName email phone profilePicture bio"
  );

  if (!building) {
    throw new ApiError("Building not found", 404);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, building, "Building retrieved successfully"));
});

/**
 * Create Building (Landlord Only)
 * Expects upload.array("images") middleware for file uploads
 */
export const createBuilding = asyncHandler(async (req, res) => {
  // Parse fields sent via FormData
  const name = req.body.name;
  console.log(name);
  const buildingType = req.body.buildingType;
  const totalFloors = req.body.totalFloors;
  const totalRooms = req.body.totalRooms;
  const description = req.body.description;
  const yearBuilt = req.body.yearBuilt;

  // Address fields (we expect address[street], address[city], ...)
  // Address fields (supports FormData + JSON)
  const address = {
    street: req.body.address?.street || req.body["address[street]"],

    city: req.body.address?.city || req.body["address[city]"],

    state: req.body.address?.state || req.body["address[state]"],

    pincode: req.body.address?.pincode || req.body["address[pincode]"],

    country:
      req.body.address?.country || req.body["address[country]"] || "India",
  };

  // Amenities - multiple entries possible
  const amenities = normalizeToArray(req.body.amenities);

  // Contact numbers - either multiple fields or comma separated string
  const contactNumbers = normalizeToArray(req.body.contactNumbers);

  // Rules - nested fields
  const rules = {
    allowPets:
      req.body["rules[allowPets]"] === "true" ||
      req.body.rules_allowPets === "true" ||
      req.body.rules_allowPets === true,
    allowGuests:
      req.body["rules[allowGuests]"] === "true" ||
      req.body.rules_allowGuests === "true" ||
      req.body.rules_allowGuests === undefined
        ? req.body.rules_allowGuests === "false"
          ? false
          : true
        : true,
    visitorTimings:
      req.body["rules[visitorTimings]"] ||
      req.body.rules_visitorTimings ||
      undefined,
    guestPolicy: req.body["rules[guestPolicy]"] || undefined,
    other: normalizeToArray(req.body["rules[other]"] || req.body.rules_other),
  };

  // Validate required fields
  console.log(
    name,
    address,
    address.street,
    address.city,
    address.state,
    address.pincode
  );
  if (
    !name ||
    !address ||
    !address.street ||
    !address.city ||
    !address.state ||
    !address.pincode
  ) {
    throw new ApiError(
      "Missing required fields: name and full address are required",
      400
    );
  }

  // Validate pincode (6 digits)
  if (!/^\d{6}$/.test(address.pincode)) {
    throw new ApiError("Pincode must be a 6-digit number", 400);
  }

  // Handle images from req.files (cloudinary via multer-storage-cloudinary)
  const files = req.files || [];
  const images = files.map((file) => ({
    url: file.path,
    publicId: file.filename || file.public_id || file.public_id,
    uploadedAt: new Date(),
  }));

  let location;

  // 1️⃣ If frontend sent location → TRUST IT
  if (req.body.location) {
    let parsed;

    try {
      parsed = JSON.parse(req.body.location);
    } catch {
      throw new ApiError("Invalid location format", 400);
    }

    const [lng, lat] = parsed.coordinates || [];

    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      throw new ApiError("Invalid location coordinates", 400);
    }

    location = {
      type: "Point",
      coordinates: [lng, lat],
    };
  }

  // 2️⃣ Fallback: backend geocoding (legacy safety)
  else {
    const { lat, lng } = await geocodeAddress(address);
    location = {
      type: "Point",
      coordinates: [lng, lat],
    };
  }
  // 🚨 Final safety check — location MUST exist
  if (!location) {
    throw new ApiError("Building location could not be determined", 400);
  }

  // Build building object
  const buildingObj = {
    name,
    buildingType,
    address,
    location,
    owner: req.user._id,
    totalFloors: totalFloors ? Number(totalFloors) : undefined,
    totalRooms: totalRooms ? Number(totalRooms) : undefined,
    yearBuilt: yearBuilt ? Number(yearBuilt) : undefined,
    description,
    amenities,
    images,
    contactNumbers,
    rules,
  };

  const building = await Building.create(buildingObj);

  return res
    .status(201)
    .json(new ApiResponse(201, building, "Building created successfully"));
});

/**
 * Update Building (Landlord Only)
 * Behavior: partial updates allowed.
 * Image handling (Option B - append/remove):
 * - To remove specific images: pass `imagesToRemove` as array of publicIds or comma-separated string in req.body
 * - To add images: include files in req.files (these will be appended)
 */
export const updateBuilding = asyncHandler(async (req, res) => {
  const buildingId = req.params.id;
  let building = await Building.findById(buildingId);

  if (!building) throw new ApiError("Building not found", 404);

  if (
    building.owner.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    throw new ApiError("Unauthorized: You do not own this building", 403);
  }

  const updates = {};
  let addressChanged = false;

  /* ---------------- SIMPLE FIELDS ---------------- */
  ["name", "buildingType", "description"].forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  if (req.body.totalFloors !== undefined)
    updates.totalFloors = Number(req.body.totalFloors);
  if (req.body.totalRooms !== undefined)
    updates.totalRooms = Number(req.body.totalRooms);
  if (req.body.yearBuilt !== undefined)
    updates.yearBuilt = Number(req.body.yearBuilt);

  /* ---------------- ADDRESS (JSON – RECOMMENDED) ---------------- */
  if (req.body.address) {
    let parsed;
    try {
      parsed = JSON.parse(req.body.address);
    } catch {
      throw new ApiError("Invalid address format", 400);
    }

    updates.address = {
      ...building.address.toObject(),
      ...parsed,
    };

    addressChanged = true;
  }

  /* ---------------- ADDRESS (LEGACY / BRACKET SUPPORT) ---------------- */
  const addressUpdates = {};

  if (req.body["address[street]"])
    addressUpdates.street = req.body["address[street]"];
  if (req.body["address[city]"])
    addressUpdates.city = req.body["address[city]"];
  if (req.body["address[state]"])
    addressUpdates.state = req.body["address[state]"];
  if (req.body["address[pincode]"])
    addressUpdates.pincode = req.body["address[pincode]"];
  if (req.body["address[country]"])
    addressUpdates.country = req.body["address[country]"];

  if (Object.keys(addressUpdates).length > 0) {
    updates.address = {
      ...building.address.toObject(),
      ...addressUpdates,
    };
    addressChanged = true;
  }

  // Validate pincode
  if (addressChanged && updates.address?.pincode) {
    if (!/^\d{6}$/.test(updates.address.pincode)) {
      throw new ApiError("Pincode must be a 6-digit number", 400);
    }
  }

  /* ---------------- 🌍 LOCATION AUTO UPDATE ---------------- */
  // 📍 1️⃣ If frontend explicitly sends location → TRUST IT
  if (req.body.location) {
    let parsed;

    try {
      parsed = JSON.parse(req.body.location);
    } catch {
      throw new ApiError("Invalid location format", 400);
    }

    const [lng, lat] = parsed.coordinates || [];

    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      throw new ApiError("Invalid location coordinates", 400);
    }

    updates.location = {
      type: "Point",
      coordinates: [lng, lat],
    };
  }

  // 🔁 2️⃣ Else fallback ONLY if address changed
  else if (addressChanged) {
    const { lat, lng } = await geocodeAddress({
      street: updates.address.street,
      city: updates.address.city,
      state: updates.address.state,
      pincode: updates.address.pincode,
      country: updates.address.country || "India",
    });

    updates.location = {
      type: "Point",
      coordinates: [lng, lat],
    };
  }

  /* ---------------- AMENITIES / CONTACT ---------------- */
  if (req.body.amenities !== undefined)
    updates.amenities = normalizeToArray(req.body.amenities);

  if (req.body.contactNumbers !== undefined)
    updates.contactNumbers = normalizeToArray(req.body.contactNumbers);

  /* ---------------- RULES ---------------- */
  if (
    req.body["rules[allowPets]"] !== undefined ||
    req.body["rules[allowGuests]"] !== undefined ||
    req.body["rules[visitorTimings]"] !== undefined ||
    req.body["rules[other]"] !== undefined ||
    req.body["rules[guestPolicy]"] !== undefined
  ) {
    updates.rules = {
      allowPets:
        req.body["rules[allowPets]"] !== undefined
          ? req.body["rules[allowPets]"] === "true"
          : building.rules?.allowPets || false,

      allowGuests:
        req.body["rules[allowGuests]"] !== undefined
          ? req.body["rules[allowGuests]"] === "true"
          : building.rules?.allowGuests || true,

      visitorTimings:
        req.body["rules[visitorTimings]"] !== undefined
          ? req.body["rules[visitorTimings]"]
          : building.rules?.visitorTimings,

      other:
        req.body["rules[other]"] !== undefined
          ? normalizeToArray(req.body["rules[other]"])
          : building.rules?.other || [],

      guestPolicy:
        req.body["rules[guestPolicy]"] !== undefined
          ? req.body["rules[guestPolicy]"]
          : building.rules?.guestPolicy,
    };
  }

  /* ---------------- IMAGE REMOVAL ---------------- */
  const imagesToRemoveRaw =
    req.body.imagesToRemove || req.body.images_to_remove;

  if (imagesToRemoveRaw) {
    const toRemove = normalizeToArray(imagesToRemoveRaw);

    for (const publicId of toRemove) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.log("Cloudinary delete error:", err.message);
      }
    }

    building.images = building.images.filter(
      (img) => !toRemove.includes(img.publicId)
    );
  }

  /* ---------------- IMAGE ADD (APPEND) ---------------- */
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename || file.public_id,
      uploadedAt: new Date(),
    }));

    building.images = [...(building.images || []), ...newImages];
  }

  /* ---------------- APPLY & SAVE ---------------- */
  Object.assign(building, updates);
  await building.save();

  return res
    .status(200)
    .json(new ApiResponse(200, building, "Building updated successfully"));
});

/**
 * Delete Building (Landlord Only)
 * Also deletes all images from Cloudinary
 */
export const deleteBuilding = asyncHandler(async (req, res) => {
  const buildingId = req.params.id;
  const building = await Building.findById(buildingId);

  if (!building) throw new ApiError("Building not found", 404);

  if (
    building.owner.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    throw new ApiError("Unauthorized: You do not own this building", 403);
  }

  // Delete all cloudinary images for this building
  if (building.images && building.images.length > 0) {
    for (const img of building.images) {
      try {
        if (img.publicId) {
          await cloudinary.uploader.destroy(img.publicId);
        }
      } catch (err) {
        console.log(
          "Cloudinary deletion error (building delete):",
          err.message
        );
      }
    }
  }

  // Delete building doc
  await building.deleteOne();

  return res
    .status(200)
    .json(
      new ApiResponse(200, null, "Building and its images deleted successfully")
    );
});

/**
 * Get Landlord's Buildings
 */
export const getLandlordBuildings = asyncHandler(async (req, res) => {
  const buildings = await Building.find({ owner: req.user._id }).sort({
    createdAt: -1,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, buildings, "Your buildings retrieved successfully")
    );
});

/**
 * Save Building (Tenant)
 */
export const saveBuilding = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) throw new ApiError("User not found", 404);

  const buildingId = req.params.id;

  const building = await Building.findById(buildingId);
  if (!building) throw new ApiError("Building not found", 404);

  if (!user.savedBuildings.includes(buildingId)) {
    user.savedBuildings.push(buildingId);
    await user.save();
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Building saved successfully"));
});

/**
 * Unsave Building (Tenant)
 */
export const unsaveBuilding = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  user.savedBuildings = user.savedBuildings.filter(
    (id) => id.toString() !== req.params.id
  );

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Building removed from saved"));
});

/**
 * Get Saved Buildings
 */
export const getSavedBuildings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "savedBuildings",
    populate: { path: "owner", select: "fullName email phone" },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user.savedBuildings,
        "Saved buildings retrieved successfully"
      )
    );
});

/**
 * Search Nearby Buildings (Geospatial)
 * Requires building.location to be set as GeoJSON Point in model
 */
export const searchNearby = asyncHandler(async (req, res) => {
  const { latitude, longitude, distance = 5 } = req.query;

  if (!latitude || !longitude) {
    throw new ApiError("Latitude and longitude are required", 400);
  }

  const maxDistance = Number(distance) * 1000; // km -> meters

  const buildings = await Building.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)],
        },
        $maxDistance: maxDistance,
      },
    },
  })
    .populate("owner", "fullName email phone")
    .limit(20);

  return res
    .status(200)
    .json(
      new ApiResponse(200, buildings, "Nearby buildings retrieved successfully")
    );
});

/**
 * Get Buildings by City
 */
export const getBuildingsByCity = asyncHandler(async (req, res) => {
  const { city, page = 1, limit = 10 } = req.query;

  if (!city) throw new ApiError("City is required", 400);

  const skip = (Number(page) - 1) * Number(limit);

  const filter = {
    "address.city": { $regex: new RegExp(`^${city}$`, "i") },
    isActive: true,
  };

  const buildings = await Building.find(filter)
    .populate("owner", "fullName email phone")
    .skip(skip)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const total = await Building.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        buildings,
        pagination: {
          total,
          pages: Math.ceil(total / Number(limit)),
          currentPage: Number(page),
        },
      },
      "Buildings in city retrieved successfully"
    )
  );
});

export default {
  getAllBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  getLandlordBuildings,
  saveBuilding,
  unsaveBuilding,
  getSavedBuildings,
  searchNearby,
  getBuildingsByCity,
};
