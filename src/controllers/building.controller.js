import Building from "../models/Building.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Get All Buildings (Public)
 */
export const getAllBuildings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, city, minRent, maxRent } = req.query;

  const filter = { isActive: true };

  if (city) filter["address.city"] = city;

  // FIXED: Rent filter should match schema fields
  if (minRent || maxRent) {
    filter["rooms.rentPerMonth"] = {};
    if (minRent) filter["rooms.rentPerMonth"].$gte = Number(minRent);
    if (maxRent) filter["rooms.rentPerMonth"].$lte = Number(maxRent);
  }

  const skip = (page - 1) * limit;

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
 */
export const createBuilding = asyncHandler(async (req, res) => {
  const {
    name,
    buildingType,
    address,
    // location,
    totalFloors,
    totalRooms,
    description,
    amenities,
    images,
    yearBuilt,
    contactNumbers,
    rules,
  } = req.body;

  // if (!name || !address || !location)
  if (!name || !address) {
    throw new ApiError("Name and address  are required", 400);
  }

  const building = new Building({
    name,
    buildingType,
    address,
    // location,
    owner: req.user._id,
    totalFloors,
    totalRooms,
    description,
    amenities,
    images,
    yearBuilt,
    contactNumbers,
    rules,
  });

  await building.save();

  return res
    .status(201)
    .json(new ApiResponse(201, building, "Building created successfully"));
});

/**
 * Update Building (Landlord Only)
 */
export const updateBuilding = asyncHandler(async (req, res) => {
  let building = await Building.findById(req.params.id);

  if (!building) throw new ApiError("Building not found", 404);

  if (building.owner.toString() !== req.user._id.toString()) {
    throw new ApiError("Unauthorized: You do not own this building", 403);
  }

  building = await Building.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, building, "Building updated successfully"));
});

/**
 * Delete Building (Landlord Only)
 */
export const deleteBuilding = asyncHandler(async (req, res) => {
  const building = await Building.findById(req.params.id);

  if (!building) throw new ApiError("Building not found", 404);

  if (building.owner.toString() !== req.user._id.toString()) {
    throw new ApiError("Unauthorized: You do not own this building", 403);
  }

  await Building.findByIdAndDelete(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Building deleted successfully"));
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
 */
export const searchNearby = asyncHandler(async (req, res) => {
  const { latitude, longitude, distance = 5 } = req.query;

  if (!latitude || !longitude) {
    throw new ApiError("Latitude and longitude are required", 400);
  }

  const maxDistance = Number(distance) * 1000; // km → meters

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

  const skip = (page - 1) * limit;

  const filter = {
    "address.city": city,
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
