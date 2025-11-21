import express from "express";
import { isAuthenticated, isAdmin } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
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
} from "../controllers/user.controller.js";

const router = express.Router();

// Public routes
router.get("/by-email", asyncHandler(getUserByEmail)); // Search by email (public)

// Admin routes
router.get("/", isAuthenticated, isAdmin, asyncHandler(getAllUsers));
router.get("/search", isAuthenticated, isAdmin, asyncHandler(searchUsers));
router.get("/stats", isAuthenticated, isAdmin, asyncHandler(getUserStatistics));
router.get(
  "/activity/:userId",
  isAuthenticated,
  isAdmin,
  asyncHandler(getUserActivity)
);

// User routes
router.get("/:id", asyncHandler(getUserById));
router.put("/:id", isAuthenticated, asyncHandler(updateUser));

// Admin only
router.delete("/:id", isAuthenticated, isAdmin, asyncHandler(deleteUser));
router.post("/:id/ban", isAuthenticated, isAdmin, asyncHandler(banUser));
router.post("/:id/unban", isAuthenticated, isAdmin, asyncHandler(unbanUser));
router.post(
  "/:id/verify-email",
  isAuthenticated,
  isAdmin,
  asyncHandler(verifyUserEmail)
);

export default router;
