import mongoose from 'mongoose';

const buildingSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, 'Please provide a building name'],
      trim: true,
      minlength: [3, 'Building name must be at least 3 characters']
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide owner ID']
    },

    buildingType: {
      type: String,
      enum: ['residential', 'mixed_use', 'hostel', 'hotel'],
      required: [true, 'Please specify building type']
    },

    // Address & Location
    address: {
      street: {
        type: String,
        required: [true, 'Please provide street address']
      },
      city: {
        type: String,
        required: [true, 'Please provide city']
      },
      state: {
        type: String,
        required: [true, 'Please provide state']
      },
      pincode: {
        type: String,
        required: [true, 'Please provide pincode']
      },
      country: {
        type: String,
        default: 'India'
      }
    },

    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Please provide coordinates']
      }
    },

    // Building Details
    totalFloors: {
      type: Number,
      required: [true, 'Please provide total floors'],
      min: [1, 'Building must have at least 1 floor']
    },

    totalRooms: {
      type: Number,
      min: [1, 'Building must have at least 1 room']
    },

    yearBuilt: {
      type: Number,
      min: [1900, 'Year must be valid']
    },

    // Description
    description: {
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },

    // Amenities
    amenities: [
      {
        type: String,
        enum: [
          'wifi',
          'parking',
          'gym',
          'pool',
          'security',
          'cctv',
          'lift',
          'garden',
          'laundry',
          'grocery_store',
          'hospital_nearby',
          'school_nearby',
          'public_transport'
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

    // Contact
    contactNumbers: [String],

    // Rules
    rules: {
      allowPets: { type: Boolean, default: false },
      allowGuests: { type: Boolean, default: true },
      visitorTimings: String,
      guestPolicy: String,
      other: [String]
    },

    // Verification
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },

    verifiedAt: Date,
    verificationNotes: String,

    // Status
    isActive: {
      type: Boolean,
      default: true
    },

    // Ratings
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

// Geospatial Index
buildingSchema.index({ 'location.coordinates': '2dsphere' });
buildingSchema.index({ 'address.city': 1 });
buildingSchema.index({ owner: 1 });
buildingSchema.index({ createdAt: -1 });

const Building = mongoose.model('Building', buildingSchema);

export default Building;
