import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isAuthenticated, isLandlordOrAdmin, isAdmin } from '../middleware/auth.middleware.js';
import { validateCreateRoom } from '../validators/validators.js';
import {
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
  getRoomsByBuilding
} from '../controllers/room.controller.js';

const router = express.Router();

// Public Routes
router.get('/', asyncHandler(getAllRooms));
router.get('/search', asyncHandler(searchRooms));
router.get('/building/:buildingId', asyncHandler(getRoomsByBuilding));
router.get('/:id', asyncHandler(getRoomById));

// Tenant Routes
router.post('/:id/save', isAuthenticated, asyncHandler(saveRoom));
router.delete('/:id/unsave', isAuthenticated, asyncHandler(unsaveRoom));
router.get('/saved/all', isAuthenticated, asyncHandler(getSavedRooms));

// Landlord Routes
router.post('/', isAuthenticated, isLandlordOrAdmin, validateCreateRoom, asyncHandler(createRoom));
router.put('/:id', isAuthenticated, isLandlordOrAdmin, asyncHandler(updateRoom));
router.delete('/:id', isAuthenticated, isLandlordOrAdmin, asyncHandler(deleteRoom));
router.get('/landlord/my-rooms', isAuthenticated, isLandlordOrAdmin, asyncHandler(getLandlordRooms));

export default router;
