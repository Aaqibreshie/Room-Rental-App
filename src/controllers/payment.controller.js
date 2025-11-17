import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create Payment Order
 */
export const createPaymentOrder = asyncHandler(async (req, res, next) => {
  const { bookingId, amount } = req.body;

  if (!bookingId || !amount) {
    throw new ApiError("Booking ID and amount are required", 400);
  }

  // Verify booking exists
  const booking = await Booking.findById(bookingId).populate("room");

  if (!booking) {
    throw new ApiError("Booking not found", 404);
  }

  if (booking.tenant.toString() !== req.user._id.toString()) {
    throw new ApiError("Unauthorized: This is not your booking", 403);
  }

  // Create Razorpay order
  const options = {
    amount: amount * 100, // Amount in paise (smallest unit)
    currency: "INR",
    receipt: `booking_${bookingId}`,
    payment_capture: 1,
  };

  try {
    const order = await razorpay.orders.create(options);

    // Save payment record
    const payment = new Payment({
      booking: bookingId,
      tenant: req.user._id,
      landlord: booking.landlord,
      amount,
      paymentMethod: "razorpay",
      razorpayOrderId: order.id,
      status: "pending",
    });

    await payment.save();

    res.status(201).json(
      new ApiResponse(
        201,
        {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
        },
        "Payment order created successfully"
      )
    );
  } catch (error) {
    throw new ApiError("Failed to create payment order", 500);
  }
});

/**
 * Verify Payment
 */
export const verifyPayment = asyncHandler(async (req, res, next) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new ApiError("Payment verification details are incomplete", 400);
  }

  // Verify signature
  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (generatedSignature !== razorpaySignature) {
    throw new ApiError("Payment verification failed: Invalid signature", 400);
  }

  // Update payment record
  const payment = await Payment.findOne({ razorpayOrderId });

  if (!payment) {
    throw new ApiError("Payment record not found", 404);
  }

  payment.status = "completed";
  payment.razorpayPaymentId = razorpayPaymentId;
  payment.paidAt = new Date();

  await payment.save();

  // Update booking status
  const booking = await Booking.findByIdAndUpdate(
    payment.booking,
    { status: "active", paymentStatus: "completed" },
    { new: true }
  );

  res.status(200).json(
    new ApiResponse(
      200,
      {
        paymentId: payment._id,
        booking: booking,
      },
      "Payment verified successfully"
    )
  );
});

/**
 * Get Payment History (Tenant)
 */
export const getPaymentHistory = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, status } = req.query;

  const filter = { tenant: req.user._id };

  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const payments = await Payment.find(filter)
    .populate("booking")
    .populate("landlord", "fullName email")
    .limit(Number(limit))
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await Payment.countDocuments(filter);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        payments,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: Number(page),
        },
      },
      "Payment history retrieved successfully"
    )
  );
});

/**
 * Get Payment Details
 */
export const getPaymentDetails = asyncHandler(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id)
    .populate("booking")
    .populate("tenant", "fullName email")
    .populate("landlord", "fullName email");

  if (!payment) {
    throw new ApiError("Payment not found", 404);
  }

  // Check authorization
  if (
    payment.tenant._id.toString() !== req.user._id.toString() &&
    payment.landlord._id.toString() !== req.user._id.toString()
  ) {
    throw new ApiError("Unauthorized: You cannot view this payment", 403);
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, payment, "Payment details retrieved successfully")
    );
});

/**
 * Request Refund
 */
export const requestRefund = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;

  if (!reason) {
    throw new ApiError("Refund reason is required", 400);
  }

  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    throw new ApiError("Payment not found", 404);
  }

  if (payment.tenant.toString() !== req.user._id.toString()) {
    throw new ApiError(
      "Unauthorized: You can only request refund for your payments",
      403
    );
  }

  if (payment.status !== "completed") {
    throw new ApiError("Cannot refund incomplete payments", 400);
  }

  payment.refundStatus = "requested";
  payment.refundReason = reason;
  payment.refundRequestedAt = new Date();

  await payment.save();

  res
    .status(200)
    .json(
      new ApiResponse(200, payment, "Refund request submitted successfully")
    );
});

/**
 * Process Refund (Admin/Landlord)
 */
export const processRefund = asyncHandler(async (req, res, next) => {
  const { approve } = req.body;

  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    throw new ApiError("Payment not found", 404);
  }

  if (
    payment.landlord.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    throw new ApiError("Unauthorized: You cannot process this refund", 403);
  }

  if (payment.refundStatus !== "requested") {
    throw new ApiError("No pending refund request for this payment", 400);
  }

  if (approve) {
    // Process Razorpay refund
    try {
      const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
        amount: payment.amount * 100,
      });

      payment.refundStatus = "completed";
      payment.refundApprovedAt = new Date();
      payment.razorpayRefundId = refund.id;
      payment.status = "refunded";

      await payment.save();

      res
        .status(200)
        .json(new ApiResponse(200, payment, "Refund processed successfully"));
    } catch (error) {
      throw new ApiError("Refund processing failed", 500);
    }
  } else {
    payment.refundStatus = "rejected";
    await payment.save();

    res
      .status(200)
      .json(new ApiResponse(200, payment, "Refund request rejected"));
  }
});

/**
 * Get Payment Statistics (Landlord)
 */
export const getPaymentStatistics = asyncHandler(async (req, res, next) => {
  const { fromDate, toDate } = req.query;

  const filter = { landlord: req.user._id, status: "completed" };

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) filter.createdAt.$lte = new Date(toDate);
  }

  const payments = await Payment.find(filter);

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPayments = payments.length;
  const averagePayment = totalPayments > 0 ? totalAmount / totalPayments : 0;

  // Monthly breakdown
  const monthlyBreakdown = await Payment.aggregate([
    { $match: filter },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } },
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        totalAmount,
        totalPayments,
        averagePayment: averagePayment.toFixed(2),
        monthlyBreakdown,
      },
      "Payment statistics retrieved successfully"
    )
  );
});

/**
 * Get All Payments (Admin)
 */
export const getAllPayments = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, status } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const payments = await Payment.find(filter)
    .populate("tenant", "fullName email")
    .populate("landlord", "fullName email")
    .populate("booking")
    .limit(Number(limit))
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await Payment.countDocuments(filter);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        payments,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: Number(page),
        },
      },
      "All payments retrieved successfully"
    )
  );
});

export default {
  createPaymentOrder,
  verifyPayment,
  getPaymentHistory,
  getPaymentDetails,
  requestRefund,
  processRefund,
  getPaymentStatistics,
  getAllPayments,
};
