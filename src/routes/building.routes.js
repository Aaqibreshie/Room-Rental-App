import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { upload } from "../middleware/multer.js";
import {
  isAuthenticated,
  isLandlordOrAdmin,
  isAdmin,
} from "../middleware/authMiddleware.js";

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

// PUBLIC ROUTES
router.get("/", asyncHandler(getAllBuildings));
router.get("/search/nearby", asyncHandler(searchNearby));

// LANDLORD ROUTES MUST COME BEFORE /:id
router.get(
  "/my-buildings",
  isAuthenticated,
  isLandlordOrAdmin,
  asyncHandler(getLandlordBuildings)
);

router.post(
  "/",
  isAuthenticated,
  isLandlordOrAdmin,
  upload.array("images", 10),
  asyncHandler(createBuilding)
);

router.put(
  "/:id",
  isAuthenticated,
  isLandlordOrAdmin,
  upload.array("images", 10),
  asyncHandler(updateBuilding)
);

router.delete(
  "/:id",
  isAuthenticated,
  isLandlordOrAdmin,
  asyncHandler(deleteBuilding)
);

// TENANT ROUTES
router.post("/:id/save", isAuthenticated, asyncHandler(saveBuilding));
router.delete("/:id/unsave", isAuthenticated, asyncHandler(unsaveBuilding));
router.get("/saved/all", isAuthenticated, asyncHandler(getSavedBuildings));

// GET BUILDING BY ID MUST ALWAYS BE LAST
router.get("/:id", asyncHandler(getBuildingById));

export default router;
