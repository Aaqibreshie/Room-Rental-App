import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Get All Users (Admin Only)
 */
export const getAllUsers = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, role, searchTerm } = req.query;

  const filter = {};

  if (role) filter.role = role;

  if (searchTerm) {
    filter.$or = [
      { fullName: { $regex: searchTerm, $options: "i" } },
      { email: { $regex: searchTerm, $options: "i" } },
      { phone: { $regex: searchTerm, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const users = await User.find(filter)
    .select("-password -refreshToken")
    .limit(Number(limit))
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(filter);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        users,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: Number(page),
        },
      },
      "Users retrieved successfully"
    )
  );
});

/**
 * Get User by ID
 */
export const getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select("-password -refreshToken")
    .populate("savedRooms")
    .populate("savedBuildings");

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user.getPublicProfile(),
        "User retrieved successfully"
      )
    );
});

/**
 * Update User (Admin Only - except self profile)
 */
export const updateUser = asyncHandler(async (req, res, next) => {
  const { fullName, email, phone, role, bio, profilePicture, address } =
    req.body;

  const userId = req.params.id;

  // Users can only update their own profile unless they're admin
  if (userId !== req.user._id.toString() && req.user.role !== "admin") {
    throw new ApiError(
      "Unauthorized: You can only update your own profile",
      403
    );
  }

  // Check if email/phone already exists
  if (email || phone) {
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
      _id: { $ne: userId },
    });

    if (existingUser) {
      throw new ApiError("Email or phone already in use", 409);
    }
  }

  // Only admin can change role
  const updateData = { fullName, bio, profilePicture, address };
  if (email) updateData.email = email.toLowerCase();
  if (phone) updateData.phone = phone;

  if (req.user.role === "admin") {
    updateData.role = role;
  }

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  }).select("-password -refreshToken");

  res
    .status(200)
    .json(
      new ApiResponse(200, user.getPublicProfile(), "User updated successfully")
    );
});

/**
 * Delete User (Admin Only)
 */
export const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  res.status(200).json(new ApiResponse(200, null, "User deleted successfully"));
});

/**
 * Ban User (Admin Only)
 */
export const banUser = asyncHandler(async (req, res, next) => {
  const { banReason } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  if (user._id.toString() === req.user._id.toString()) {
    throw new ApiError("You cannot ban yourself", 400);
  }

  user.isBanned = true;
  user.banReason = banReason || "User violated terms and conditions";
  user.bannedAt = new Date();

  await user.save();

  res
    .status(200)
    .json(
      new ApiResponse(200, user.getPublicProfile(), "User banned successfully")
    );
});

/**
 * Unban User (Admin Only)
 */
export const unbanUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  if (!user.isBanned) {
    throw new ApiError("User is not banned", 400);
  }

  user.isBanned = false;
  user.banReason = null;
  user.bannedAt = null;

  await user.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user.getPublicProfile(),
        "User unbanned successfully"
      )
    );
});

/**
 * Get User Statistics (Admin)
 */
export const getUserStatistics = asyncHandler(async (req, res, next) => {
  const totalUsers = await User.countDocuments();
  const tenants = await User.countDocuments({ role: "tenant" });
  const landlords = await User.countDocuments({ role: "landlord" });
  const admins = await User.countDocuments({ role: "admin" });
  const bannedUsers = await User.countDocuments({ isBanned: true });

  // Users joined this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const thisMonthUsers = await User.countDocuments({
    createdAt: { $gte: startOfMonth },
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        totalUsers,
        tenants,
        landlords,
        admins,
        bannedUsers,
        thisMonthUsers,
        breakdown: {
          tenants: ((tenants / totalUsers) * 100).toFixed(2) + "%",
          landlords: ((landlords / totalUsers) * 100).toFixed(2) + "%",
        },
      },
      "User statistics retrieved successfully"
    )
  );
});

/**
 * Get User Activity (Admin)
 */
export const getUserActivity = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findById(userId).select(
    "fullName email lastLogin createdAt role"
  );

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        ...user.toObject(),
        accountAge:
          Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)) +
          " days",
      },
      "User activity retrieved successfully"
    )
  );
});

/**
 * Verify User Email (Admin)
 */
export const verifyUserEmail = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  user.isEmailVerified = true;
  user.emailVerifiedAt = new Date();

  await user.save();

  res
    .status(200)
    .json(new ApiResponse(200, null, "User email verified successfully"));
});

/**
 * Get User by Email (Admin Search)
 */
export const getUserByEmail = asyncHandler(async (req, res, next) => {
  const { email } = req.query;

  if (!email) {
    throw new ApiError("Email is required", 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "-password -refreshToken"
  );

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user.getPublicProfile(),
        "User retrieved successfully"
      )
    );
});

/**
 * Search Users (Admin)
 */
export const searchUsers = asyncHandler(async (req, res, next) => {
  const { searchTerm, role, page = 1, limit = 10 } = req.query;

  if (!searchTerm) {
    throw new ApiError("Search term is required", 400);
  }

  const filter = {
    $or: [
      { fullName: { $regex: searchTerm, $options: "i" } },
      { email: { $regex: searchTerm, $options: "i" } },
      { phone: { $regex: searchTerm, $options: "i" } },
    ],
  };

  if (role) filter.role = role;

  const skip = (page - 1) * limit;

  const users = await User.find(filter)
    .select("-password -refreshToken")
    .limit(Number(limit))
    .skip(skip);

  const total = await User.countDocuments(filter);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        users,
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

export default {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  banUser,
  unbanUser,
  getUserStatistics,
  getUserActivity,
  verifyUserEmail,
  getUserByEmail,
  searchUsers,
};
