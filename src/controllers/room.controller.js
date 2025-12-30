import Room from "../models/Room.js";
import Building from "../models/Building.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import cloudinary from "../config/cloudinary.js";

/**
 * Get All Rooms (Public)
 */
export const getAllRooms = asyncHandler(async (req, res, next) => {
  console.log("reached");
  const {
    page = 1,
    limit = 10,
    roomType,
    minPrice,
    maxPrice,
    city,
  } = req.query;

  const filter = { status: "active", isAvailable: true };

  if (roomType) filter.roomType = roomType;

  if (minPrice || maxPrice) {
    filter.rentPerMonth = {};
    if (minPrice) filter.rentPerMonth.$gte = Number(minPrice);
    if (maxPrice) filter.rentPerMonth.$lte = Number(maxPrice);
  }

  // If city filter provided (apply before query)
  if (city) {
    // we'll filter by building.address.city using aggregation-like approach:
    // simple approach: find buildings in city, then filter rooms by building ids
    const buildingsInCity = await Building.find({
      "address.city": { $regex: new RegExp(`^${city}$`, "i") },
    }).select("_id");

    const buildingIds = buildingsInCity.map((b) => b._id);
    // if no building found, return empty result
    if (buildingIds.length === 0) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            rooms: [],
            pagination: {
              total: 0,
              pages: 0,
              currentPage: Number(page),
              limit: Number(limit),
            },
          },
          "Rooms retrieved successfully"
        )
      );
    }
    filter.building = { $in: buildingIds };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const rooms = await Room.find(filter)
    .populate({
      path: "building",
      select: "name address",
    })
    .populate("landlord", "fullName email phone profilePicture")
    .limit(Number(limit))
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await Room.countDocuments(filter);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        rooms,
        pagination: {
          total,
          pages: Math.ceil(total / Number(limit)),
          currentPage: Number(page),
          limit: Number(limit),
        },
      },
      "Rooms retrieved successfully"
    )
  );
});

//** * Get Nearby Rooms Sorted by Distance (Public)
export const getAllRoomsSortedByDistance = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    throw new ApiError("Latitude and longitude are required", 400);
    //do not show error show room without distance
  }

  const rooms = await Building.aggregate([
    {
      // 1️⃣ Calculate distance from user
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [Number(lng), Number(lat)],
        },
        distanceField: "distance", // meters
        spherical: true,
      },
    },

    {
      // 2️⃣ Join rooms
      $lookup: {
        from: "rooms",
        localField: "_id",
        foreignField: "building",
        as: "rooms",
      },
    },

    {
      // 3️⃣ Flatten rooms
      $unwind: "$rooms",
    },

    {
      // 4️⃣ Only active & available rooms
      $match: {
        "rooms.status": "active",
        "rooms.isAvailable": true,
      },
    },

    {
      // 5️⃣ Sort nearest → farthest
      $sort: { distance: 1 },
    },

    {
      // 6️⃣ Shape output
      $project: {
        _id: "$rooms._id",
        room: "$rooms",
        building: {
          _id: "$_id",
          name: "$name",
          address: "$address",
        },
        distance: { $round: ["$distance", 0] },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        rooms,
        "All rooms sorted by distance fetched successfully"
      )
    );
});

/**
 * Get Room by ID
 */
export const getRoomById = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.id)
    .populate("building")
    .populate("landlord", "fullName email phone profilePicture bio");

  if (!room) {
    throw new ApiError("Room not found", 404);
  }
  console.log("USER:", req.user?._id);
  console.log("SAVED ROOMS:", req.user?.savedRooms);
  console.log("ROOM ID:", room._id);

  let isSavedForUser = false;

  if (req.user && Array.isArray(req.user.savedRooms)) {
    const roomIdStr = room._id.toString();

    isSavedForUser = req.user.savedRooms.some(
      (savedId) => savedId?.toString() === roomIdStr
    );
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        room,
        isSavedForUser,
      },
      "Room retrieved successfully"
    )
  );
});

/**
 * Create Room (Landlord Only)
 * Expects upload.array("images") middleware before this controller
 */
export const createRoom = asyncHandler(async (req, res) => {
  console.log("REQ.BODY:", req.body);
  const {
    roomNumber,
    building,
    title,
    description,
    roomType,
    capacity,
    floor,
    rentPerMonth,
    rentPerNight,
    securityDeposit,
    maintenanceCharge,
    furnishingStatus,
    bookingType,
    preferredTenantType,
    preferredGender,
    availableFrom,
  } = req.body;

  // 1️⃣ Verify building exists
  const buildingDoc = await Building.findById(building);
  if (!buildingDoc) {
    throw new ApiError("Building not found", 404);
  }

  // 🔹 INHERIT LOCATION FROM BUILDING
  const location = building.location;

  // 2️⃣ Verify building belongs to this owner
  if (buildingDoc.owner.toString() !== req.user._id.toString()) {
    throw new ApiError("Unauthorized: Building does not belong to you", 403);
  }

  // 3️⃣ Parse nested fields (ensure numbers where needed)
  const roomSize = {
    value: req.body["roomSize[value]"]
      ? Number(req.body["roomSize[value]"])
      : undefined,
    unit: req.body["roomSize[unit]"] || undefined,
  };

  const minimumStay = {
    value: req.body["minimumStay[value]"]
      ? Number(req.body["minimumStay[value]"])
      : undefined,
    unit: req.body["minimumStay[unit]"] || undefined,
  };

  // 4️⃣ Parse rules
  const rules = {
    allowPets: req.body["rules[allowPets]"] === "true",
    allowGuests: req.body["rules[allowGuests]"] === "true",
    guestTimings: req.body["rules[guestTimings]"] || undefined,
    noOfGuestAllowed: req.body["rules[noOfGuestAllowed]"]
      ? Number(req.body["rules[noOfGuestAllowed]"])
      : undefined,
    other: req.body["rules[other]"]
      ? Array.isArray(req.body["rules[other]"])
        ? req.body["rules[other]"]
        : [req.body["rules[other]"]]
      : [],
  };

  // 5️⃣ Normalize amenities into arrays
  const normalizeToArray = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    // If a comma-separated string is sent, split it
    if (typeof v === "string" && v.includes(","))
      return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    return [v];
  };

  const amenities = normalizeToArray(req.body.amenities);
  const sharedAmenities = normalizeToArray(req.body.sharedAmenities);

  // 6️⃣ Handle image upload (req.files from multer-storage-cloudinary)
  const files = req.files || [];
  const images = files.map((file) => ({
    url: file.path,
    publicId: file.filename || file.public_id || file.public_id, // multer-storage-cloudinary uses filename as public_id
    uploadedAt: new Date(),
  }));

  // 7️⃣ Create room (with numeric conversions)
  const room = await Room.create({
    roomNumber,
    building,
    landlord: req.user._id,
    title,
    description,
    roomType,
    capacity: capacity ? Number(capacity) : undefined,
    currentOccupancy: 0,
    floor: floor ? Number(floor) : undefined,
    roomSize,
    rentPerMonth: rentPerMonth ? Number(rentPerMonth) : undefined,
    rentPerNight: rentPerNight ? Number(rentPerNight) : undefined,
    securityDeposit: securityDeposit ? Number(securityDeposit) : undefined,
    maintenanceCharge: maintenanceCharge ? Number(maintenanceCharge) : 0,
    furnishingStatus,
    amenities,
    sharedAmenities,
    bookingType: bookingType || "monthly",
    minimumStay,
    rules,
    preferredTenantType: preferredTenantType
      ? Array.isArray(preferredTenantType)
        ? preferredTenantType
        : [preferredTenantType]
      : ["any"],
    preferredGender: preferredGender || "any",
    images,
    availableFrom: availableFrom ? new Date(availableFrom) : undefined,
  });
  console.log(room);

  // Add room reference to building
  await Building.findByIdAndUpdate(building, {
    $push: { rooms: room._id },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, room, "Room created successfully"));
});

/**
 * Update Room (Landlord Only)
 * If new images are uploaded (req.files), old images in Cloudinary are removed and replaced.
 * Expects upload.array("images") optional in route.
 */
export const updateRoom = asyncHandler(async (req, res, next) => {
  const roomId = req.params.id;
  let room = await Room.findById(roomId);

  if (!room) {
    throw new ApiError("Room not found", 404);
  }

  // Authorization: landlord or admin
  if (
    room.landlord.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    throw new ApiError("Unauthorized: You do not own this room", 403);
  }

  // Build update object carefully
  const updates = {};

  // Simple scalar/strings (only update if provided)
  const simpleFields = [
    "roomNumber",
    "title",
    "description",
    "roomType",
    "furnishingStatus",
    "bookingType",
    "preferredGender",
  ];
  simpleFields.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  // Numeric fields
  if (req.body.capacity !== undefined)
    updates.capacity = Number(req.body.capacity);
  if (req.body.floor !== undefined) updates.floor = Number(req.body.floor);
  if (req.body.rentPerMonth !== undefined)
    updates.rentPerMonth = Number(req.body.rentPerMonth);
  if (req.body.rentPerNight !== undefined)
    updates.rentPerNight = Number(req.body.rentPerNight);
  if (req.body.securityDeposit !== undefined)
    updates.securityDeposit = Number(req.body.securityDeposit);
  if (req.body.maintenanceCharge !== undefined)
    updates.maintenanceCharge = Number(req.body.maintenanceCharge);

  // Nested: roomSize
  if (
    req.body["roomSize[value]"] !== undefined ||
    req.body["roomSize[unit]"] !== undefined
  ) {
    updates.roomSize = {
      value:
        req.body["roomSize[value]"] !== undefined
          ? Number(req.body["roomSize[value]"])
          : room.roomSize?.value || undefined,
      unit:
        req.body["roomSize[unit]"] !== undefined
          ? req.body["roomSize[unit]"]
          : room.roomSize?.unit || undefined,
    };
  }

  // Nested: minimumStay
  if (
    req.body["minimumStay[value]"] !== undefined ||
    req.body["minimumStay[unit]"] !== undefined
  ) {
    updates.minimumStay = {
      value:
        req.body["minimumStay[value]"] !== undefined
          ? Number(req.body["minimumStay[value]"])
          : room.minimumStay?.value || undefined,
      unit:
        req.body["minimumStay[unit]"] !== undefined
          ? req.body["minimumStay[unit]"]
          : room.minimumStay?.unit || undefined,
    };
  }

  // Rules
  if (
    req.body["rules[allowPets]"] !== undefined ||
    req.body["rules[allowGuests]"] !== undefined ||
    req.body["rules[guestTimings]"] !== undefined ||
    req.body["rules[noOfGuestAllowed]"] !== undefined
  ) {
    updates.rules = {
      allowPets:
        req.body["rules[allowPets]"] !== undefined
          ? req.body["rules[allowPets]"] === "true"
          : room.rules?.allowPets || false,
      allowGuests:
        req.body["rules[allowGuests]"] !== undefined
          ? req.body["rules[allowGuests]"] === "true"
          : room.rules?.allowGuests || true,
      guestTimings:
        req.body["rules[guestTimings]"] !== undefined
          ? req.body["rules[guestTimings]"]
          : room.rules?.guestTimings || undefined,
      noOfGuestAllowed:
        req.body["rules[noOfGuestAllowed]"] !== undefined
          ? Number(req.body["rules[noOfGuestAllowed]"])
          : room.rules?.noOfGuestAllowed || undefined,
    };
  }

  // Amenities (replace if provided)
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

  if (req.body.amenities !== undefined)
    updates.amenities = normalizeToArray(req.body.amenities);
  if (req.body.sharedAmenities !== undefined)
    updates.sharedAmenities = normalizeToArray(req.body.sharedAmenities);

  // Preferred tenant type (could be array or single)
  if (req.body.preferredTenantType !== undefined) {
    updates.preferredTenantType = Array.isArray(req.body.preferredTenantType)
      ? req.body.preferredTenantType
      : [req.body.preferredTenantType];
  }

  // AvailableFrom
  if (req.body.availableFrom !== undefined)
    updates.availableFrom = req.body.availableFrom
      ? new Date(req.body.availableFrom)
      : undefined;

  // If building is being changed (rare), validate ownership
  if (req.body.building !== undefined) {
    const newBuilding = await Building.findById(req.body.building);
    if (!newBuilding) throw new ApiError("Building not found", 404);
    if (
      newBuilding.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      throw new ApiError("Unauthorized to use this building", 403);
    }
    updates.building = req.body.building;
  }

  // IMAGE HANDLING: if new files uploaded, delete old images and replace
  const files = req.files || [];
  if (files.length > 0) {
    // delete old images from cloudinary
    if (room.images && room.images.length > 0) {
      for (const img of room.images) {
        try {
          if (img.publicId) {
            await cloudinary.uploader.destroy(img.publicId);
          }
        } catch (err) {
          console.log("Cloudinary deletion error (update):", err.message);
        }
      }
    }

    // map new files
    const newImages = files.map((file) => ({
      url: file.path,
      publicId: file.filename || file.public_id,
      uploadedAt: new Date(),
    }));

    updates.images = newImages;
  }

  // Perform update
  const updatedRoom = await Room.findByIdAndUpdate(roomId, updates, {
    new: true,
    runValidators: true,
  });

  res
    .status(200)
    .json(new ApiResponse(200, updatedRoom, "Room updated successfully"));
});

/**
 * Delete Room (Landlord Only)
 */
export const deleteRoom = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 1️⃣ Find room
  const room = await Room.findById(id);
  if (!room) {
    throw new ApiError("Room not found", 404);
  }

  // 2️⃣ Ensure only landlord or admin can delete
  if (
    room.landlord.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    throw new ApiError("Unauthorized to delete this room", 403);
  }

  // 3️⃣ Delete images from Cloudinary
  if (room.images && room.images.length > 0) {
    for (const img of room.images) {
      try {
        if (img.publicId) {
          await cloudinary.uploader.destroy(img.publicId);
        }
      } catch (err) {
        console.log("Cloudinary deletion error:", err.message);
      }
    }
  }

  // 4️⃣ Delete room from database
  await room.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Room and images deleted successfully"));
});

/**
 * Get Landlord's Rooms
 */
export const getLandlordRooms = asyncHandler(async (req, res, next) => {
  const rooms = await Room.find({ landlord: req.user._id })
    .populate("building")
    .sort({ createdAt: -1 });

  res
    .status(200)
    .json(new ApiResponse(200, rooms, "Your rooms retrieved successfully"));
});

/**
 * Save Room (Tenant)
 */
export const saveRoom = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const roomId = req.params.id;

  // Check if room exists
  const room = await Room.findById(roomId);
  if (!room) {
    throw new ApiError("Room not found", 404);
  }

  if (!user.savedRooms.includes(roomId)) {
    user.savedRooms.push(roomId);
    await user.save();
  }

  res.status(200).json(new ApiResponse(200, null, "Room saved successfully"));
});

/**
 * Unsave Room (Tenant)
 */
export const unsaveRoom = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const roomId = req.params.id;

  user.savedRooms = user.savedRooms.filter((id) => id.toString() !== roomId);
  await user.save();

  res.status(200).json(new ApiResponse(200, null, "Room removed from saved"));
});

/**
 * Get Saved Rooms
 */
export const getSavedRooms = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate({
    path: "savedRooms",
    populate: [
      { path: "building" },
      { path: "landlord", select: "fullName email phone" },
    ],
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user.savedRooms,
        "Saved rooms retrieved successfully"
      )
    );
});

/**
 * Search Rooms
 */
export const searchRooms = asyncHandler(async (req, res, next) => {
  const {
    search,
    city,
    roomType,
    minPrice,
    maxPrice,
    page = 1,
    limit = 10,
  } = req.query;

  const filter = { status: "active" };

  // Use $text search if text provided (faster when index exists)
  if (search) {
    // text search
    filter.$text = { $search: search };
  }

  if (roomType) filter.roomType = roomType;

  if (minPrice || maxPrice) {
    filter.rentPerMonth = {};
    if (minPrice) filter.rentPerMonth.$gte = Number(minPrice);
    if (maxPrice) filter.rentPerMonth.$lte = Number(maxPrice);
  }

  // If city filter provided, restrict by building city first
  if (city) {
    const buildingsInCity = await Building.find({
      "address.city": { $regex: new RegExp(`^${city}$`, "i") },
    }).select("_id");

    const buildingIds = buildingsInCity.map((b) => b._id);
    if (buildingIds.length === 0) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            rooms: [],
            pagination: { total: 0, pages: 0, currentPage: Number(page) },
          },
          "Search results retrieved successfully"
        )
      );
    }
    filter.building = { $in: buildingIds };
  }

  const skip = (Number(page) - 1) * Number(limit);

  let rooms = await Room.find(filter)
    .populate("building")
    .populate("landlord", "fullName email phone")
    .limit(Number(limit))
    .skip(skip);

  const total = await Room.countDocuments(filter);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        rooms,
        pagination: {
          total,
          pages: Math.ceil(total / Number(limit)),
          currentPage: Number(page),
        },
      },
      "Search results retrieved successfully"
    )
  );
});

/**
 * Get Rooms by Building
 */
export const getRoomsByBuilding = asyncHandler(async (req, res, next) => {
  const { buildingId } = req.params;

  // Verify building exists
  const building = await Building.findById(buildingId);
  if (!building) {
    throw new ApiError("Building not found", 404);
  }

  const rooms = await Room.find({
    building: buildingId,
    status: "active",
  }).populate("landlord", "fullName email phone");

  res
    .status(200)
    .json(new ApiResponse(200, rooms, "Rooms retrieved successfully"));
});
//** Toggle Room Availability (Landlord Only) */
export const toggleRoomAvailability = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id).populate("building");

  if (!room) throw new ApiError("Room not found", 404);

  // Ownership check
  if (
    room.building.owner.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    throw new ApiError("Unauthorized", 403);
  }

  room.isAvailable = !room.isAvailable;
  await room.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isAvailable: room.isAvailable,
      },
      "Room availability updated"
    )
  );
});

export default {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  getLandlordRooms,
  saveRoom,
  unsaveRoom,
  getSavedRooms,
  searchRooms,
  getRoomsByBuilding,
};
