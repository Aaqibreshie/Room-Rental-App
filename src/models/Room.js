import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    // Basic Information
    roomNumber: {
      type: String,
      required: [true, 'Please provide a room number'],
      trim: true
    },

    building: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Building',
      required: [true, 'Please provide a building ID']
    },

    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a landlord ID']
    },

    // Room Details
    title: {
      type: String,
      required: [true, 'Please provide a room title'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters']
    },

    description: {
      type: String,
      required: [true, 'Please provide a description'],
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },

    roomType: {
      type: String,
      enum: ['single', 'shared', 'suite', 'studio'],
      required: [true, 'Please specify a room type']
    },

    capacity: {
      type: Number,
      required: [true, 'Please provide room capacity'],
      min: [1, 'Capacity must be at least 1']
    },

    currentOccupancy: {
      type: Number,
      default: 0,
      min: 0
    },

    floor: {
      type: Number,
      required: [true, 'Please provide floor number'],
      min: [0, 'Floor cannot be negative']
    },

    roomSize: {
      value: Number,
      unit: {
        type: String,
        enum: ['sqft', 'sqm'],
        default: 'sqft'
      }
    },

    // Pricing
    rentPerMonth: {
      type: Number,
      required: [true, 'Please provide monthly rent'],
      min: [0, 'Rent cannot be negative']
    },

    rentPerNight: {
      type: Number,
      min: [0, 'Rent cannot be negative']
    },

    securityDeposit: {
      type: Number,
      required: [true, 'Please provide security deposit'],
      min: [0, 'Deposit cannot be negative']
    },

    maintenanceCharge: Number,

    // Furnishing & Facilities
    furnishingStatus: {
      type: String,
      enum: ['unfurnished', 'semi_furnished', 'fully_furnished'],
      required: [true, 'Please specify furnishing status']
    },

    amenities: [
      {
        type: String,
        enum: [
          'bed',
          'mattress',
          'pillow',
          'cupboard',
          'desk',
          'chair',
          'fan',
          'ac',
          'heater',
          'lights',
          'curtains',
          'carpet',
          'bathroom',
          'attached_bathroom',
          'hot_water',
          'balcony',
          'window'
        ]
      }
    ],

    sharedAmenities: [
      {
        type: String,
        enum: [
          'kitchen',
          'dining_area',
          'living_room',
          'common_tv',
          'laundry',
          'internet',
          'parking',
          'garden',
          'security_guard'
        ]
      }
    ],

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

    // Booking Type
    bookingType: {
      type: String,
      enum: ['monthly', 'nightly', 'both'],
      default: 'monthly'
    },

    minimumStay: {
      value: Number,
      unit: {
        type: String,
        enum: ['days', 'months'],
        default: 'months'
      }
    },

    // Availability
    isAvailable: {
      type: Boolean,
      default: true
    },

    availableFrom: Date,

    // Rules
    rules: {
      allowPets: { type: Boolean, default: false },
      allowGuests: { type: Boolean, default: true },
      guestTimings: String,
      noOfGuestAllowed: Number,
      other: [String]
    },

    // Preferences
    preferredTenantType: [
      {
        type: String,
        enum: ['student', 'working_professional', 'any']
      }
    ],

    preferredGender: {
      type: String,
      enum: ['male', 'female', 'any'],
      default: 'any'
    },

    // Visibility
    status: {
      type: String,
      enum: ['active', 'inactive', 'delisted'],
      default: 'active'
    },

    // Ratings & Reviews
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },

    totalRatings: {
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
roomSchema.index({ building: 1 });
roomSchema.index({ landlord: 1 });
roomSchema.index({ isAvailable: 1, status: 1 });
roomSchema.index({ rentPerMonth: 1 });
roomSchema.index({ roomType: 1 });
roomSchema.index({ createdAt: -1 });

const Room = mongoose.model('Room', roomSchema);

export default Room;
