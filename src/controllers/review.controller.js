import Review from "../models/Review.js";
import Room from "../models/Room.js";
import Booking from "../models/Booking.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Create Review (Tenant Only)
 */
export const createReview = asyncHandler(async (req, res, next) => {
  const { roomId, landlordId, rating, title, comment } = req.body;

  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    throw new ApiError("Rating must be between 1 and 5", 400);
  }

  // Verify user had booking
  const booking = await Booking.findOne({
    room: roomId,
    tenant: req.user._id,
    status: "completed",
  });

  if (!booking) {
    throw new ApiError(
      "You can only review rooms you have booked and completed",
      400
    );
  }

  // Check if already reviewed
  const existingReview = await Review.findOne({
    room: roomId,
    reviewedBy: req.user._id,
  });

  if (existingReview) {
    throw new ApiError("You have already reviewed this room", 400);
  }

  const review = new Review({
    room: roomId,
    landlord: landlordId,
    reviewedBy: req.user._id,
    rating,
    title,
    comment,
    type: "room",
  });

  await review.save();

  // Update room average rating
  const reviews = await Review.find({ room: roomId });
  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  await Room.findByIdAndUpdate(roomId, {
    averageRating: avgRating,
    totalReviews: reviews.length,
  });

  res
    .status(201)
    .json(new ApiResponse(201, review, "Review created successfully"));
});

/**
 * Get Room Reviews
 */
export const getRoomReviews = asyncHandler(async (req, res, next) => {
  const { roomId } = req.params;
  const { page = 1, limit = 10, sortBy = "recent" } = req.query;

  // Verify room exists
  const room = await Room.findById(roomId);
  if (!room) {
    throw new ApiError("Room not found", 404);
  }

  const skip = (page - 1) * limit;

  let sortOption = { createdAt: -1 };
  if (sortBy === "helpful") sortOption = { helpfulCount: -1 };
  if (sortBy === "rating-high") sortOption = { rating: -1 };
  if (sortBy === "rating-low") sortOption = { rating: 1 };

  const reviews = await Review.find({ room: roomId })
    .populate("reviewedBy", "fullName profilePicture")
    .limit(Number(limit))
    .skip(skip)
    .sort(sortOption);

  const total = await Review.countDocuments({ room: roomId });

  const stats = {
    averageRating: room.averageRating,
    totalReviews: room.totalReviews,
    ratingBreakdown: {
      5: await Review.countDocuments({ room: roomId, rating: 5 }),
      4: await Review.countDocuments({ room: roomId, rating: 4 }),
      3: await Review.countDocuments({ room: roomId, rating: 3 }),
      2: await Review.countDocuments({ room: roomId, rating: 2 }),
      1: await Review.countDocuments({ room: roomId, rating: 1 }),
    },
  };

  res.status(200).json(
    new ApiResponse(
      200,
      {
        reviews,
        stats,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: Number(page),
        },
      },
      "Reviews retrieved successfully"
    )
  );
});

/**
 * Get Landlord Reviews
 */
export const getLandlordReviews = asyncHandler(async (req, res, next) => {
  const { landlordId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  const reviews = await Review.find({ landlord: landlordId })
    .populate("room", "title")
    .populate("reviewedBy", "fullName profilePicture")
    .limit(Number(limit))
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await Review.countDocuments({ landlord: landlordId });

  const avgRating =
    (
      await Review.aggregate([
        { $match: { landlord: landlordId } },
        { $group: { _id: null, avgRating: { $avg: "$rating" } } },
      ])
    )[0]?.avgRating || 0;

  res.status(200).json(
    new ApiResponse(
      200,
      {
        reviews,
        stats: {
          averageRating: avgRating.toFixed(1),
          totalReviews: total,
        },
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: Number(page),
        },
      },
      "Landlord reviews retrieved successfully"
    )
  );
});

/**
 * Update Review (Own Review Only)
 */
export const updateReview = asyncHandler(async (req, res, next) => {
  const { rating, title, comment } = req.body;

  const review = await Review.findById(req.params.id);

  if (!review) {
    throw new ApiError("Review not found", 404);
  }

  if (review.reviewedBy.toString() !== req.user._id.toString()) {
    throw new ApiError("Unauthorized: You can only edit your own review", 403);
  }

  if (rating && (rating < 1 || rating > 5)) {
    throw new ApiError("Rating must be between 1 and 5", 400);
  }

  review.rating = rating || review.rating;
  review.title = title || review.title;
  review.comment = comment || review.comment;

  await review.save();

  // Update room rating
  const reviews = await Review.find({ room: review.room });
  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  await Room.findByIdAndUpdate(review.room, {
    averageRating: avgRating,
  });

  res
    .status(200)
    .json(new ApiResponse(200, review, "Review updated successfully"));
});

/**
 * Delete Review (Own Review Only)
 */
export const deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    throw new ApiError("Review not found", 404);
  }

  if (review.reviewedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(
      "Unauthorized: You can only delete your own review",
      403
    );
  }

  const roomId = review.room;
  await Review.findByIdAndDelete(req.params.id);

  // Update room rating
  const reviews = await Review.find({ room: roomId });
  if (reviews.length > 0) {
    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Room.findByIdAndUpdate(roomId, {
      averageRating: avgRating,
      totalReviews: reviews.length,
    });
  } else {
    await Room.findByIdAndUpdate(roomId, {
      averageRating: 0,
      totalReviews: 0,
    });
  }

  res
    .status(200)
    .json(new ApiResponse(200, null, "Review deleted successfully"));
});

/**
 * Landlord Response to Review
 */
export const respondToReview = asyncHandler(async (req, res, next) => {
  const { response } = req.body;

  if (!response) {
    throw new ApiError("Response message is required", 400);
  }

  const review = await Review.findById(req.params.id);

  if (!review) {
    throw new ApiError("Review not found", 404);
  }

  if (review.landlord.toString() !== req.user._id.toString()) {
    throw new ApiError(
      "Unauthorized: You can only respond to reviews about your properties",
      403
    );
  }

  review.landlordResponse = {
    message: response,
    respondedAt: new Date(),
  };

  await review.save();

  res
    .status(200)
    .json(new ApiResponse(200, review, "Response added successfully"));
});

/**
 * Mark Review as Helpful
 */
export const markHelpful = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    throw new ApiError("Review not found", 404);
  }

  if (!review.helpfulBy.includes(req.user._id)) {
    review.helpfulBy.push(req.user._id);
    review.helpfulCount += 1;
    await review.save();
  }

  res
    .status(200)
    .json(new ApiResponse(200, review, "Review marked as helpful"));
});

/**
 * Get Recent Reviews (Dashboard)
 */
export const getRecentReviews = asyncHandler(async (req, res, next) => {
  const reviews = await Review.find()
    .populate("room", "title")
    .populate("reviewedBy", "fullName profilePicture")
    .limit(10)
    .sort({ createdAt: -1 });

  res
    .status(200)
    .json(
      new ApiResponse(200, reviews, "Recent reviews retrieved successfully")
    );
});

export default {
  createReview,
  getRoomReviews,
  getLandlordReviews,
  updateReview,
  deleteReview,
  respondToReview,
  markHelpful,
  getRecentReviews,
};
