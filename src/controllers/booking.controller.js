import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendEmail } from "../services/email.service.js";

/**
 * Create Booking (Tenant)
 */
export const createBooking = asyncHandler(async (req, res, next) => {
  const { roomId, moveInDate, leaseEndDate } = req.body;
  const tenantId = req.user._id;

  // Verify room exists
  const room = await Room.findById(roomId).populate("landlord");
  if (!room) {
    throw new ApiError("Room not found", 404);
  }

  // Verify room is available
  if (!room.isAvailable) {
    throw new ApiError("Room is not available for booking", 400);
  }

  // Verify dates
  const moveIn = new Date(moveInDate);
  const leaseEnd = new Date(leaseEndDate);

  if (moveIn < new Date()) {
    throw new ApiError("Move-in date cannot be in the past", 400);
  }

  if (leaseEnd <= moveIn) {
    throw new ApiError("Lease end date must be after move-in date", 400);
  }

  // Check for conflicting bookings
  const existingBooking = await Booking.findOne({
    room: roomId,
    status: { $in: ["approved", "active"] },
    $or: [{ moveInDate: { $lte: leaseEnd }, leaseEndDate: { $gte: moveIn } }],
  });

  if (existingBooking) {
    throw new ApiError("Room has conflicting booking for selected dates", 400);
  }

  // Create booking
  const booking = new Booking({
    room: roomId,
    tenant: tenantId,
    landlord: room.landlord._id,
    moveInDate,
    leaseEndDate,
    monthlyRent: room.rentPerMonth,
    securityDeposit: room.securityDeposit,
    status: "pending",
  });

  await booking.save();

  // Send notification email to landlord
  try {
    await sendEmail({
      email: room.landlord.email,
      subject: "New Booking Request - Room Rental Platform",
      template: "bookingRequest",
      data: {
        landlordName: room.landlord.fullName,
        tenantName: req.user.fullName,
        roomTitle: room.title,
        moveInDate: moveInDate,
      },
    });
  } catch (error) {
    console.log("Email notification failed but booking created");
  }

  res
    .status(201)
    .json(
      new ApiResponse(201, booking, "Booking request created successfully")
    );
});

/**
 * Get My Bookings (Tenant)
 */
export const getMyBookings = asyncHandler(async (req, res, next) => {
  let bookings;

  if (req.user.role === "tenant") {
    bookings = await Booking.find({ tenant: req.user._id })
      .populate("room")
      .populate("landlord", "fullName email phone")
      .sort({ createdAt: -1 });
  } else if (req.user.role === "landlord") {
    bookings = await Booking.find({ landlord: req.user._id })
      .populate("room")
      .populate("tenant", "fullName email phone")
      .sort({ createdAt: -1 });
  }

  res
    .status(200)
    .json(new ApiResponse(200, bookings, "Bookings retrieved successfully"));
});

/**
 * Get Booking by ID
 */
export const getBookingById = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id)
    .populate("room")
    .populate("tenant", "fullName email phone")
    .populate("landlord", "fullName email phone");

  if (!booking) {
    throw new ApiError("Booking not found", 404);
  }

  // Verify access
  if (
    booking.tenant._id.toString() !== req.user._id.toString() &&
    booking.landlord._id.toString() !== req.user._id.toString()
  ) {
    throw new ApiError("Unauthorized: You cannot view this booking", 403);
  }

  res
    .status(200)
    .json(new ApiResponse(200, booking, "Booking retrieved successfully"));
});

/**
 * Approve Booking (Landlord)
 */
export const approveBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id)
    .populate("room")
    .populate("tenant");

  if (!booking) {
    throw new ApiError("Booking not found", 404);
  }

  if (booking.landlord.toString() !== req.user._id.toString()) {
    throw new ApiError("Unauthorized: You do not own this booking", 403);
  }

  if (booking.status !== "pending") {
    throw new ApiError(`Booking is already ${booking.status}`, 400);
  }

  booking.status = "approved";
  await booking.save();

  // Send approval email
  try {
    await sendEmail({
      email: booking.tenant.email,
      subject: "Booking Approved - Room Rental Platform",
      template: "bookingApproved",
      data: {
        tenantName: booking.tenant.fullName,
        roomTitle: booking.room.title,
        moveInDate: booking.moveInDate,
      },
    });
  } catch (error) {
    console.log("Email notification failed");
  }

  res
    .status(200)
    .json(new ApiResponse(200, booking, "Booking approved successfully"));
});

/**
 * Reject Booking (Landlord)
 */
export const rejectBooking = asyncHandler(async (req, res, next) => {
  const { rejectionReason } = req.body;
  const booking = await Booking.findById(req.params.id).populate("tenant");

  if (!booking) {
    throw new ApiError("Booking not found", 404);
  }

  if (booking.landlord.toString() !== req.user._id.toString()) {
    throw new ApiError("Unauthorized: You do not own this booking", 403);
  }

  if (booking.status !== "pending") {
    throw new ApiError(`Booking is already ${booking.status}`, 400);
  }

  booking.status = "rejected";
  booking.rejectionReason = rejectionReason || "No reason provided";
  await booking.save();

  // Send rejection email
  try {
    await sendEmail({
      email: booking.tenant.email,
      subject: "Booking Request Rejected - Room Rental Platform",
      template: "bookingRejected",
      data: {
        tenantName: booking.tenant.fullName,
        rejectionReason: booking.rejectionReason,
      },
    });
  } catch (error) {
    console.log("Email notification failed");
  }

  res
    .status(200)
    .json(new ApiResponse(200, booking, "Booking rejected successfully"));
});

/**
 * Cancel Booking (Tenant)
 */
export const cancelBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id).populate("landlord");

  if (!booking) {
    throw new ApiError("Booking not found", 404);
  }

  if (booking.tenant.toString() !== req.user._id.toString()) {
    throw new ApiError("Unauthorized: You do not own this booking", 403);
  }

  if (["cancelled", "completed"].includes(booking.status)) {
    throw new ApiError(`Cannot cancel ${booking.status} booking`, 400);
  }

  booking.status = "cancelled";
  await booking.save();

  // Notify landlord
  try {
    await sendEmail({
      email: booking.landlord.email,
      subject: "Booking Cancelled - Room Rental Platform",
      template: "bookingCancelled",
      data: {
        landlordName: booking.landlord.fullName,
      },
    });
  } catch (error) {
    console.log("Email notification failed");
  }

  res
    .status(200)
    .json(new ApiResponse(200, booking, "Booking cancelled successfully"));
});

/**
 * Get Booking Requests (Landlord)
 */
export const getBookingRequests = asyncHandler(async (req, res, next) => {
  const bookings = await Booking.find({
    landlord: req.user._id,
    status: "pending",
  })
    .populate("room")
    .populate("tenant", "fullName email phone profilePicture")
    .sort({ createdAt: -1 });

  res
    .status(200)
    .json(
      new ApiResponse(200, bookings, "Booking requests retrieved successfully")
    );
});

/**
 * Complete Booking (Landlord)
 */
export const completeBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new ApiError("Booking not found", 404);
  }

  if (booking.landlord.toString() !== req.user._id.toString()) {
    throw new ApiError("Unauthorized: You do not own this booking", 403);
  }

  if (booking.status !== "active") {
    throw new ApiError("Only active bookings can be completed", 400);
  }

  booking.status = "completed";
  booking.actualMoveOutDate = new Date();
  await booking.save();

  res
    .status(200)
    .json(new ApiResponse(200, booking, "Booking completed successfully"));
});

/**
 * Get All Bookings (Admin)
 */
export const getAllBookings = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, status } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const bookings = await Booking.find(filter)
    .populate("room")
    .populate("tenant", "fullName email")
    .populate("landlord", "fullName email")
    .limit(Number(limit))
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await Booking.countDocuments(filter);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        bookings,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: Number(page),
        },
      },
      "Bookings retrieved successfully"
    )
  );
});

export default {
  createBooking,
  getMyBookings,
  getBookingById,
  approveBooking,
  rejectBooking,
  cancelBooking,
  getBookingRequests,
  completeBooking,
  getAllBookings,
};
