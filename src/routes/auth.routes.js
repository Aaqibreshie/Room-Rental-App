import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isAuthenticated, isLandlordOrAdmin } from '../middleware/auth.middleware.js';
import { validateRegister, validateLogin } from '../validators/validators.js';
import {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  refreshToken
} from '../controllers/auth.controller.js';

const router = express.Router();

// Public Routes
router.post('/register', validateRegister, asyncHandler(registerUser));
router.post('/login', validateLogin, asyncHandler(loginUser));
router.post('/forgot-password', asyncHandler(forgotPassword));
router.post('/reset-password/:token', asyncHandler(resetPassword));
router.post('/refresh-token', asyncHandler(refreshToken));

// Protected Routes
router.get('/logout', isAuthenticated, asyncHandler(logoutUser));
router.get('/me', isAuthenticated, asyncHandler(getProfile));
router.put('/profile', isAuthenticated, asyncHandler(updateProfile));
router.put('/change-password', isAuthenticated, asyncHandler(changePassword));

export default router;
