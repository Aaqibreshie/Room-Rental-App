import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  isAuthenticated,
  isLandlordOrAdmin,
  isAdmin,
} from "../middleware/authMiddleware.js";
import { validateCreateBuilding } from "../validators/validators.js";
import {
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
} from "../controllers/building.controller.js";

const router = express.Router();

// Public Routes
router.get("/", asyncHandler(getAllBuildings));
router.get("/search/nearby", asyncHandler(searchNearby));
router.get("/:id", asyncHandler(getBuildingById));

// Tenant Routes
router.post("/:id/save", isAuthenticated, asyncHandler(saveBuilding));
router.delete("/:id/unsave", isAuthenticated, asyncHandler(unsaveBuilding));
router.get("/saved/all", isAuthenticated, asyncHandler(getSavedBuildings));

// Landlord Routes
router.post(
  "/",
  isAuthenticated,
  isLandlordOrAdmin,
  validateCreateBuilding,
  asyncHandler(createBuilding)
);
router.put(
  "/:id",
  isAuthenticated,
  isLandlordOrAdmin,
  asyncHandler(updateBuilding)
);
router.delete(
  "/:id",
  isAuthenticated,
  isLandlordOrAdmin,
  asyncHandler(deleteBuilding)
);
router.get(
  "/landlord/my-buildings",
  isAuthenticated,
  isLandlordOrAdmin,
  asyncHandler(getLandlordBuildings)
);

export default router;
