import express from "express";
// import { asyncHandler } from "../utils/asyncHandler.js";
import {
  isAuthenticated,
  isLandlordOrAdmin,
} from "../middleware/authMiddleware.js";
import { validateRegister, validateLogin } from "../validators/validators.js";
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
} from "../controllers/authController.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

// Public Routes
router.post("/register", validateRegister, registerUser);
// router.post("/register", validateRegister, asyncHandler(registerUser));
// router.post("/register", asyncHandler(registerUser));
// router.post("/login", validateLogin, asyncHandler(loginUser));
router.post("/login", loginUser);
// router.post("/forgot-password", asyncHandler(forgotPassword));
router.post("/forgot-password", forgotPassword);
// router.post("/reset-password/:token", asyncHandler(resetPassword));
router.post("/reset-password/:token", resetPassword);
// router.post("/refresh-token", asyncHandler(refreshToken));
router.post("/refresh-token", refreshToken);

// // Protected Routes
router.get("/logout", isAuthenticated, logoutUser);
// router.get("/logout", isAuthenticated, asyncHandler(logoutUser));
// router.get("/me", isAuthenticated, asyncHandler(getProfile));
router.get("/me", isAuthenticated, getProfile);
// router.put("/profile", isAuthenticated, asyncHandler(updateProfile));
router.put("/profile", isAuthenticated, updateProfile);
// router.put("/change-password", isAuthenticated, asyncHandler(changePassword));
router.put("/change-password", isAuthenticated, changePassword);

export default router;
