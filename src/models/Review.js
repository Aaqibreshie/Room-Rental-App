import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    reviewType: {
      type: String,
      enum: ['room', 'building', 'user'],
      required: [true, 'Please specify review type']
    },

    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room'
    },

    building: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Building'
    },

    reviewedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide reviewer ID']
    },

    // Review Content
    rating: {
      type: Number,
      required: [true, 'Please provide a rating'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },

    title: {
      type: String,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },

    comment: {
      type: String,
      required: [true, 'Please provide a review comment'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },

    // Detailed Ratings (Optional)
    detailedRatings: {
      cleanliness: { type: Number, min: 1, max: 5 },
      amenities: { type: Number, min: 1, max: 5 },
      location: { type: Number, min: 1, max: 5 },
      valueForMoney: { type: Number, min: 1, max: 5 },
      landlord_responsiveness: { type: Number, min: 1, max: 5 },
      security: { type: Number, min: 1, max: 5 }
    },

    // Images
    images: [
      {
        url: String,
        publicId: String,
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // Verification
    isVerified: {
      type: Boolean,
      default: false
    },

    isApproved: {
      type: Boolean,
      default: true
    },

    // Response from Owner/Reviewed User
    response: {
      comment: String,
      respondedAt: Date,
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },

    // Helpfulness
    helpfulCount: {
      type: Number,
      default: 0
    },

    unhelpfulCount: {
      type: Number,
      default: 0
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now
    },

    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Indexes
reviewSchema.index({ room: 1 });
reviewSchema.index({ building: 1 });
reviewSchema.index({ reviewedUser: 1 });
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
