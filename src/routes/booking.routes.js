import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { validateCreateBooking } from '../validators/validators.js';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  approveBooking,
  rejectBooking,
  cancelBooking,
  getBookingRequests,
  completeBooking,
  getAllBookings
} from '../controllers/booking.controller.js';

const router = express.Router();

// Tenant Routes
router.post('/', isAuthenticated, validateCreateBooking, asyncHandler(createBooking));
router.get('/my-bookings', isAuthenticated, asyncHandler(getMyBookings));
router.get('/:id', isAuthenticated, asyncHandler(getBookingById));
router.put('/:id/cancel', isAuthenticated, asyncHandler(cancelBooking));

// Landlord Routes
router.get('/requests/all', isAuthenticated, asyncHandler(getBookingRequests));
router.put('/:id/approve', isAuthenticated, asyncHandler(approveBooking));
router.put('/:id/reject', isAuthenticated, asyncHandler(rejectBooking));
router.put('/:id/complete', isAuthenticated, asyncHandler(completeBooking));

// Admin Routes
router.get('/', isAuthenticated, asyncHandler(getAllBookings));

export default router;
