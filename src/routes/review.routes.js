import { isAuthenticated } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createReview,
  getRoomReviews,
  getLandlordReviews,
  updateReview,
  deleteReview,
  respondToReview,
  markHelpful,
  getRecentReviews,
} from "../controllers/review.controller.js";

const router = express.Router();

// Public routes
router.get("/room/:roomId", asyncHandler(getRoomReviews));
router.get("/landlord/:landlordId", asyncHandler(getLandlordReviews));
router.get("/recent", asyncHandler(getRecentReviews));

// Authenticated user routes
router.post("/", isAuthenticated, asyncHandler(createReview));
router.put("/:id", isAuthenticated, asyncHandler(updateReview));
router.delete("/:id", isAuthenticated, asyncHandler(deleteReview));
router.post("/:id/helpful", isAuthenticated, asyncHandler(markHelpful));

// Landlord routes
router.post("/:id/respond", isAuthenticated, asyncHandler(respondToReview));

export default router;
