import express from "express";
import { isAuthenticated, isAdmin } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createPaymentOrder,
  verifyPayment,
  getPaymentHistory,
  getPaymentDetails,
  requestRefund,
  processRefund,
  getPaymentStatistics,
  getAllPayments,
} from "../controllers/payment.controller.js";

const router = express.Router();

// User routes
router.post("/order", isAuthenticated, asyncHandler(createPaymentOrder));
router.post("/verify", isAuthenticated, asyncHandler(verifyPayment));
router.get("/history", isAuthenticated, asyncHandler(getPaymentHistory));
router.get("/:id", isAuthenticated, asyncHandler(getPaymentDetails));
router.post(
  "/:id/refund-request",
  isAuthenticated,
  asyncHandler(requestRefund)
);
router.get("/stats", isAuthenticated, asyncHandler(getPaymentStatistics));

// Landlord routes
router.post(
  "/:id/refund-process",
  isAuthenticated,
  asyncHandler(processRefund)
);

// Admin routes
router.get("/", isAuthenticated, isAdmin, asyncHandler(getAllPayments));

export default router;
