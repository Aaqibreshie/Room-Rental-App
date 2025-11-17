import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Please provide a room ID']
    },

    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a tenant ID']
    },

    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a landlord ID']
    },

    // Dates
    moveInDate: {
      type: Date,
      required: [true, 'Please provide move-in date']
    },

    leaseEndDate: {
      type: Date,
      required: [true, 'Please provide lease end date']
    },

    actualMoveInDate: Date,
    actualMoveOutDate: Date,

    // Financial
    monthlyRent: {
      type: Number,
      required: [true, 'Please provide monthly rent']
    },

    securityDeposit: {
      type: Number,
      required: [true, 'Please provide security deposit amount']
    },

    depositPaid: {
      type: Boolean,
      default: false
    },

    depositReturnedAmount: Number,
    depositReturnedAt: Date,

    // Status
    status: {
      type: String,
      enum: ['pending', 'approved', 'active', 'completed', 'cancelled', 'rejected'],
      default: 'pending'
    },

    rejectionReason: String,

    // Agreement
    agreementDocumentUrl: String,
    agreementSignedAt: Date,

    // Notifications
    notificationSent: {
      type: Boolean,
      default: false
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
bookingSchema.index({ room: 1, tenant: 1 });
bookingSchema.index({ landlord: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ moveInDate: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
