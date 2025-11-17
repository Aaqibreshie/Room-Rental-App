import Building from "../models/Building.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Get All Buildings (Public)
 */
export const getAllBuildings = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    city,
    minRent,
    maxRent,
    furnishingStatus,
  } = req.query;

  const filter = { status: "active" };

  if (city) filter["address.city"] = city;
  if (furnishingStatus) filter.furnishingStatus = furnishingStatus;

  if (minRent || maxRent) {
    filter.averageRent = {};
    if (minRent) filter.averageRent.$gte = Number(minRent);
    if (maxRent) filter.averageRent.$lte = Number(maxRent);
  }

  const skip = (page - 1) * limit;

  const buildings = await Building.find(filter)
    .populate("owner", "fullName email phone profilePicture")
    .limit(Number(limit))
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await Building.countDocuments(filter);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        buildings,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
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
export const getBuildingById = asyncHandler(async (req, res, next) => {
  const building = await Building.findById(req.params.id)
    .populate("owner", "fullName email phone profilePicture bio")
    .populate({
      path: "rooms",
      select: "roomNumber title rentPerMonth amenities isAvailable",
    });

  if (!building) {
    throw new ApiError("Building not found", 404);
  }

  res
    .status(200)
    .json(new ApiResponse(200, building, "Building retrieved successfully"));
});

/**
 * Create Building (Landlord Only)
 */
export const createBuilding = asyncHandler(async (req, res, next) => {
  const {
    buildingName,
    address,
    totalFloors,
    totalRooms,
    description,
    amenities,
    images,
    yearBuilt,
    buildingType,
    legalStatus,
  } = req.body;

  // Verify required fields
  if (!buildingName || !address) {
    throw new ApiError("Building name and address are required", 400);
  }

  const building = new Building({
    buildingName,
    address,
    owner: req.user._id,
    totalFloors,
    totalRooms,
    description,
    amenities,
    images,
    yearBuilt,
    buildingType,
    legalStatus,
  });

  await building.save();

  res
    .status(201)
    .json(new ApiResponse(201, building, "Building created successfully"));
});

/**
 * Update Building (Landlord Only)
 */
export const updateBuilding = asyncHandler(async (req, res, next) => {
  let building = await Building.findById(req.params.id);

  if (!building) {
    throw new ApiError("Building not found", 404);
  }

  if (building.owner.toString() !== req.user._id.toString()) {
    throw new ApiError("Unauthorized: You do not own this building", 403);
  }

  building = await Building.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res
    .status(200)
    .json(new ApiResponse(200, building, "Building updated successfully"));
});

/**
 * Delete Building (Landlord Only)
 */
export const deleteBuilding = asyncHandler(async (req, res, next) => {
  const building = await Building.findById(req.params.id);

  if (!building) {
    throw new ApiError("Building not found", 404);
  }

  if (building.owner.toString() !== req.user._id.toString()) {
    throw new ApiError("Unauthorized: You do not own this building", 403);
  }

  // Check if building has active rooms
  const activeRooms = await Building.findById(req.params.id).populate("rooms");
  if (activeRooms.rooms.length > 0) {
    throw new ApiError(
      "Cannot delete building with active rooms. Delete all rooms first.",
      400
    );
  }

  await Building.findByIdAndDelete(req.params.id);

  res
    .status(200)
    .json(new ApiResponse(200, null, "Building deleted successfully"));
});

/**
 * Get Landlord's Buildings
 */
export const getLandlordBuildings = asyncHandler(async (req, res, next) => {
  const buildings = await Building.find({ owner: req.user._id })
    .populate({
      path: "rooms",
      select: "roomNumber title rentPerMonth isAvailable",
    })
    .sort({ createdAt: -1 });

  res
    .status(200)
    .json(
      new ApiResponse(200, buildings, "Your buildings retrieved successfully")
    );
});

/**
 * Save Building (Tenant)
 */
export const saveBuilding = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const buildingId = req.params.id;

  // Check if building exists
  const building = await Building.findById(buildingId);
  if (!building) {
    throw new ApiError("Building not found", 404);
  }

  if (!user.savedBuildings.includes(buildingId)) {
    user.savedBuildings.push(buildingId);
    await user.save();
  }

  res
    .status(200)
    .json(new ApiResponse(200, null, "Building saved successfully"));
});

/**
 * Unsave Building (Tenant)
 */
export const unsaveBuilding = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const buildingId = req.params.id;

  user.savedBuildings = user.savedBuildings.filter(
    (id) => id.toString() !== buildingId
  );
  await user.save();

  res
    .status(200)
    .json(new ApiResponse(200, null, "Building removed from saved"));
});

/**
 * Get Saved Buildings
 */
export const getSavedBuildings = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate({
    path: "savedBuildings",
    populate: {
      path: "owner",
      select: "fullName email phone",
    },
  });

  res
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
 */
export const searchNearby = asyncHandler(async (req, res, next) => {
  const { latitude, longitude, distance = 5 } = req.query;

  if (!latitude || !longitude) {
    throw new ApiError("Latitude and longitude are required", 400);
  }

  // Distance in kilometers (convert to miles for MongoDB: 1 km ≈ 0.621371 miles)
  const maxDistance = Number(distance) * 1609.34; // Convert km to meters

  const buildings = await Building.find({
    status: "active",
    "address.location": {
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

  res
    .status(200)
    .json(
      new ApiResponse(200, buildings, "Nearby buildings retrieved successfully")
    );
});

/**
 * Get Buildings by City
 */
export const getBuildingsByCity = asyncHandler(async (req, res, next) => {
  const { city, page = 1, limit = 10 } = req.query;

  if (!city) {
    throw new ApiError("City is required", 400);
  }

  const skip = (page - 1) * limit;

  const buildings = await Building.find({
    "address.city": city,
    status: "active",
  })
    .populate("owner", "fullName email phone")
    .limit(Number(limit))
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await Building.countDocuments({
    "address.city": city,
    status: "active",
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        buildings,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
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
