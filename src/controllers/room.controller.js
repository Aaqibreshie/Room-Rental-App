import Room from "../models/Room.js";
import Building from "../models/Building.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Get All Rooms (Public)
 */
export const getAllRooms = asyncHandler(async (req, res, next) => {
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

  const skip = (page - 1) * limit;

  const rooms = await Room.find(filter)
    .populate("building")
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
          pages: Math.ceil(total / limit),
          currentPage: Number(page),
          limit: Number(limit),
        },
      },
      "Rooms retrieved successfully"
    )
  );
});

/**
 * Get Room by ID
 */
export const getRoomById = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.id)
    .populate("building")
    .populate("landlord", "fullName email phone profilePicture bio")
    .populate("reviews");

  if (!room) {
    throw new ApiError("Room not found", 404);
  }

  res
    .status(200)
    .json(new ApiResponse(200, room, "Room retrieved successfully"));
});

/**
 * Create Room (Landlord Only)
 */
export const createRoom = asyncHandler(async (req, res, next) => {
  const {
    roomNumber,
    building,
    title,
    description,
    roomType,
    capacity,
    floor,
    roomSize,
    rentPerMonth,
    rentPerNight,
    securityDeposit,
    maintenanceCharge,
    furnishingStatus,
    amenities,
    sharedAmenities,
    bookingType,
    minimumStay,
    rules,
    preferredTenantType,
    preferredGender,
    images,
  } = req.body;

  // Verify building exists
  const buildingDoc = await Building.findById(building);
  if (!buildingDoc) {
    throw new ApiError("Building not found", 404);
  }

  // Verify ownership
  if (buildingDoc.owner.toString() !== req.user._id.toString()) {
    throw new ApiError("Unauthorized: Building does not belong to you", 403);
  }

  const room = new Room({
    roomNumber,
    building,
    landlord: req.user._id,
    title,
    description,
    roomType,
    capacity,
    floor,
    roomSize,
    rentPerMonth,
    rentPerNight,
    securityDeposit,
    maintenanceCharge,
    furnishingStatus,
    amenities,
    sharedAmenities,
    bookingType,
    minimumStay,
    rules,
    preferredTenantType,
    preferredGender,
    images,
  });

  await room.save();

  res.status(201).json(new ApiResponse(201, room, "Room created successfully"));
});

/**
 * Update Room (Landlord Only)
 */
export const updateRoom = asyncHandler(async (req, res, next) => {
  let room = await Room.findById(req.params.id);

  if (!room) {
    throw new ApiError("Room not found", 404);
  }

  if (room.landlord.toString() !== req.user._id.toString()) {
    throw new ApiError("Unauthorized: You do not own this room", 403);
  }

  room = await Room.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json(new ApiResponse(200, room, "Room updated successfully"));
});

/**
 * Delete Room (Landlord Only)
 */
export const deleteRoom = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.id);

  if (!room) {
    throw new ApiError("Room not found", 404);
  }

  if (room.landlord.toString() !== req.user._id.toString()) {
    throw new ApiError("Unauthorized: You do not own this room", 403);
  }

  await Room.findByIdAndDelete(req.params.id);

  res.status(200).json(new ApiResponse(200, null, "Room deleted successfully"));
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

  // Search in title and description
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (roomType) filter.roomType = roomType;

  if (minPrice || maxPrice) {
    filter.rentPerMonth = {};
    if (minPrice) filter.rentPerMonth.$gte = Number(minPrice);
    if (maxPrice) filter.rentPerMonth.$lte = Number(maxPrice);
  }

  const skip = (page - 1) * limit;

  let rooms = await Room.find(filter)
    .populate("building")
    .populate("landlord", "fullName email phone")
    .limit(Number(limit))
    .skip(skip);

  // Filter by city if provided
  if (city) {
    rooms = rooms.filter(
      (room) =>
        room.building?.address?.city?.toLowerCase() === city.toLowerCase()
    );
  }

  const total = await Room.countDocuments(filter);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        rooms,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
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
