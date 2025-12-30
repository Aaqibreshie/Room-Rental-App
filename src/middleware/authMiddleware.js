import jwt from "jsonwebtoken";
import config from "../config/config.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/User.js";

// Verify JWT Token
export const isAuthenticated = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError("Please login to access this resource", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      throw new ApiError("User not found", 404);
    }

    next();
  } catch (err) {
    throw new ApiError("Invalid or expired token", 401);
  }
});

// Authorize specific roles
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(
        `Role: ${req.user.role} is not allowed to access this resource`,
        403
      );
    }
    next();
  };
};

// Check if user is landlord or admin
export const isLandlordOrAdmin = (req, res, next) => {
  if (req.user.role !== "landlord" && req.user.role !== "admin") {
    throw new ApiError(
      "Only landlords and admins can access this resource",
      403
    );
  }
  next();
};

// Check if user is tenant
export const isTenant = (req, res, next) => {
  if (req.user.role !== "tenant") {
    throw new ApiError("Only tenants can access this resource", 403);
  }
  next();
};

// Check if user is admin
export const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    throw new ApiError("Only admins can access this resource", 403);
  }
  next();
};
// Optional authentication middleware
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // No token → guest user → continue
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("savedRooms role");
  } catch (err) {
    // Invalid token → still allow request
    req.user = null;
  }

  next();
};

export default {
  isAuthenticated,
  authorizeRoles,
  isLandlordOrAdmin,
  isTenant,
  isAdmin,
  optionalAuth,
};
