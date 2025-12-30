import express from "express";
import { upload } from "../middleware/multer.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  isAuthenticated,
  isLandlordOrAdmin,
  isAdmin,
  optionalAuth,
} from "../middleware/authMiddleware.js";
import { validateCreateRoom } from "../validators/validators.js";
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
  getRoomsByBuilding,
  getAllRoomsSortedByDistance as getNearbyRoomsSorted,
  toggleRoomAvailability,
} from "../controllers/room.controller.js";

const router = express.Router();

/* -------------------------------------------
   PUBLIC ROUTES
-------------------------------------------- */
router.get("/", asyncHandler(getAllRooms));
router.get("/nearby-all", asyncHandler(getNearbyRoomsSorted));

router.get("/search", asyncHandler(searchRooms));
router.get("/building/:buildingId", asyncHandler(getRoomsByBuilding));

/* -------------------------------------------
   LANDLORD ROUTES (PUT BEFORE /:id)
-------------------------------------------- */
router.get(
  "/my-rooms",
  isAuthenticated,
  isLandlordOrAdmin,
  asyncHandler(getLandlordRooms)
);

router.post(
  "/",
  isAuthenticated,
  isLandlordOrAdmin,
  upload.array("images", 10), // MUST COME BEFORE VALIDATION
  validateCreateRoom,
  asyncHandler(createRoom)
);

router.put(
  "/:id",
  isAuthenticated,
  isLandlordOrAdmin,
  upload.array("images", 10),
  asyncHandler(updateRoom)
);

router.delete(
  "/:id",
  isAuthenticated,
  isLandlordOrAdmin,
  asyncHandler(deleteRoom)
);

/* -------------------------------------------
   TENANT ROUTES
-------------------------------------------- */
router.get("/saved/all", isAuthenticated, asyncHandler(getSavedRooms));
router.post("/:id/save", isAuthenticated, asyncHandler(saveRoom));
router.delete("/:id/unsave", isAuthenticated, asyncHandler(unsaveRoom));

/* -------------------------------------------
   GET ROOM BY ID (ALWAYS LAST!)
-------------------------------------------- */
router.get(
  "/:id",
  optionalAuth,
  (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  },
  asyncHandler(getRoomById)
);
router.patch(
  "/:id/toggle-availability",
  isAuthenticated,
  isLandlordOrAdmin,
  toggleRoomAvailability
);

export default router;
