import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    // Basic Information
    roomNumber: {
      type: String,
      required: [true, "Please provide a room number"],
      trim: true,
    },

    building: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: [true, "Please provide a building ID"],
      index: true,
    },

    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide a landlord ID"],
      index: true,
    },

    // Room Details
    title: {
      type: String,
      required: [true, "Please provide a room title"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
    },

    description: {
      type: String,
      required: [true, "Please provide a description"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    roomType: {
      type: String,
      enum: ["single", "shared", "suite", "studio"],
      required: [true, "Please specify a room type"],
      index: true,
    },

    capacity: {
      type: Number,
      required: [true, "Please provide room capacity"],
      min: [1, "Capacity must be at least 1"],
    },

    currentOccupancy: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: function (value) {
          return value <= this.capacity;
        },
        message: "Current occupancy cannot exceed room capacity",
      },
    },

    floor: {
      type: Number,
      required: [true, "Please provide floor number"],
      min: [0, "Floor cannot be negative"],
    },

    roomSize: {
      value: { type: Number, min: 1 },
      unit: {
        type: String,
        enum: ["sqft", "sqm"],
        default: "sqft",
      },
    },

    // Pricing
    rentPerMonth: {
      type: Number,
      required: [true, "Please provide monthly rent"],
      min: [0, "Rent cannot be negative"],
      index: true,
    },

    rentPerNight: { type: Number, min: 0 },

    securityDeposit: {
      type: Number,
      required: [true, "Please provide security deposit"],
      min: [0, "Deposit cannot be negative"],
    },

    maintenanceCharge: {
      type: Number,
      default: 0,
    },

    // Furnishing & Facilities
    furnishingStatus: {
      type: String,
      enum: ["unfurnished", "semi_furnished", "fully_furnished"],
      required: [true, "Please specify furnishing status"],
    },

    amenities: [
      {
        type: String,
        enum: [
          "bed",
          "mattress",
          "pillow",
          "cupboard",
          "desk",
          "chair",
          "fan",
          "ac",
          "heater",
          "lights",
          "curtains",
          "carpet",
          "bathroom",
          "attached_bathroom",
          "hot_water",
          "balcony",
          "window",
        ],
      },
    ],

    sharedAmenities: [
      {
        type: String,
        enum: [
          "kitchen",
          "dining_area",
          "living_room",
          "common_tv",
          "laundry",
          "internet",
          "parking",
          "garden",
          "security_guard",
        ],
      },
    ],

    // Images
    images: [
      {
        url: { type: String, required: true },
        publicId: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // Booking Type
    bookingType: {
      type: String,
      enum: ["monthly", "nightly", "both"],
      default: "monthly",
    },

    minimumStay: {
      value: { type: Number, min: 1 },
      unit: {
        type: String,
        enum: ["days", "months"],
        default: "months",
      },
    },

    // Availability
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },

    availableFrom: Date,

    // Rules
    rules: {
      allowPets: { type: Boolean, default: false },
      allowGuests: { type: Boolean, default: true },
      guestTimings: String,
      noOfGuestAllowed: Number,
      other: [String],
    },

    // Preferences
    preferredTenantType: {
      type: [String],
      enum: ["student", "working_professional", "any"],
      default: ["any"],
    },

    preferredGender: {
      type: String,
      enum: ["male", "female", "any"],
      default: "any",
    },

    // Visibility
    status: {
      type: String,
      enum: ["active", "inactive", "delisted"],
      default: "active",
      index: true,
    },

    // Ratings
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalRatings: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// FULL-TEXT SEARCH INDEX
roomSchema.index({ title: "text", description: "text" });

// OTHER INDEXES
// roomSchema.index({ building: 1 });
// roomSchema.index({ landlord: 1 });
// roomSchema.index({ createdAt: -1 });

const Room = mongoose.model("Room", roomSchema);

export default Room;
