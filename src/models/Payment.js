import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Please provide a booking ID']
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

    // Payment Details
    amount: {
      type: Number,
      required: [true, 'Please provide payment amount'],
      min: [0, 'Amount cannot be negative']
    },

    paymentType: {
      type: String,
      enum: ['rent', 'security_deposit', 'maintenance', 'late_fee'],
      required: [true, 'Please specify payment type']
    },

    paymentMethod: {
      type: String,
      enum: ['card', 'upi', 'netbanking', 'wallet', 'cash'],
      required: true
    },

    // Transaction Details
    transactionId: String,
    paymentGateway: {
      type: String,
      enum: ['razorpay', 'stripe', 'paytm', 'manual'],
      default: 'razorpay'
    },

    // Status
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },

    // Due & Payment Dates
    dueDate: Date,
    paidDate: Date,
    refundedDate: Date,

    // Refund Details
    refundAmount: Number,
    refundReason: String,

    // Additional Info
    description: String,
    notes: String,

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
paymentSchema.index({ booking: 1 });
paymentSchema.index({ tenant: 1 });
paymentSchema.index({ landlord: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paidDate: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
