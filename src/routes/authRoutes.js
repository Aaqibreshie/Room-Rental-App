import express from "express";
// import { asyncHandler } from "../utils/asyncHandler.js";
import {
  isAuthenticated,
  isLandlordOrAdmin,
} from "../middleware/authMiddleware.js";
import { validateRegister, validateLogin } from "../validators/validators.js";
import { upload } from "../middleware/multer.js";
// import {
//   registerUser,
//   loginUser,
//   logoutUser,
//   getProfile,
//   updateProfile,
//   changePassword,
//   forgotPassword,
//   resetPassword,
//   refreshToken,
// } from "../controllers/authController.js";

import {
  registerUser,
  loginUser,
  resetPassword,
  forgotPassword,
  changePassword,
  refreshToken,
  logoutUser,
  getProfile,
  updateProfile,
  toggleSaveRoom,
  getSavedRooms,
  verifyResetOtp,
} from "../controllers/authController.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

// Public Routes

router.post("/register", validateRegister, asyncHandler(registerUser));

router.post("/login", validateLogin, asyncHandler(loginUser));

router.post("/forgot-password", asyncHandler(forgotPassword));

router.post("/reset-password/:token", asyncHandler(resetPassword));

router.post("/refresh-token", asyncHandler(refreshToken));

// // Protected Routes
router.get("/logout", isAuthenticated, asyncHandler(logoutUser));
router.get("/me", isAuthenticated, asyncHandler(getProfile));
router.get("/saved-rooms", isAuthenticated, asyncHandler(getSavedRooms));
router.post("/verify-reset-otp", verifyResetOtp);
router.put("/reset-password/:token", resetPassword);
router.post(
  "/saved-rooms/:roomId",
  isAuthenticated,
  asyncHandler(toggleSaveRoom)
);

router.put(
  "/profile",
  isAuthenticated,
  upload.single("image"),
  asyncHandler(updateProfile)
);

router.put("/change-password", isAuthenticated, asyncHandler(changePassword));

export default router;
