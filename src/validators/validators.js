import { body, validationResult } from "express-validator";
import ApiError from "../utils/ApiError.js";

// Validation error handler middleware
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((err) => `${err.param}: ${err.msg}`)
      .join(", ");

    return next(new ApiError(errorMessages, 400)); // ✔ cleaner
  }
  next();
};

// ===== AUTH VALIDATORS =====

export const validateRegister = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 3, max: 50 })
    .withMessage("Name must be between 3 and 50 characters"),

  body("email")
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("Please provide a valid email")
    .notEmpty()
    .withMessage("Email is required"),

  body("phone")
    .matches(/^[6-9]\d{9}$/) //Change this
    .withMessage("Please provide a valid 10-digit Indian phone number"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and numbers"),

  body("role")
    .optional()
    .isIn(["tenant", "landlord"])
    .withMessage("Invalid role"),

  handleValidationErrors,
];

export const validateLogin = [
  body("email")
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("Please provide a valid email"),

  body("password").notEmpty().withMessage("Password is required"),

  handleValidationErrors,
];

// ===== ROOM VALIDATORS =====

export const validateCreateRoom = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Room title is required")
    .isLength({ min: 5 })
    .withMessage("Title must be at least 5 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ max: 2000 })
    .withMessage("Description cannot exceed 2000 characters"),

  body("roomType")
    .isIn(["single", "shared", "suite", "studio"])
    .withMessage("Invalid room type"),

  body("capacity").isInt({ min: 1 }).withMessage("Capacity must be at least 1"),

  body("floor").isInt({ min: 0 }).withMessage("Floor cannot be negative"),

  body("rentPerMonth")
    .isInt({ min: 0 })
    .withMessage("Rent must be a positive number"),

  body("securityDeposit")
    .isInt({ min: 0 })
    .withMessage("Security deposit must be a positive number"),

  body("furnishingStatus")
    .isIn(["unfurnished", "semi_furnished", "fully_furnished"])
    .withMessage("Invalid furnishing status"),

  body("building")
    .notEmpty()
    .withMessage("Building ID is required")
    .isMongoId()
    .withMessage("Invalid building ID"),

  handleValidationErrors,
];

// ===== BUILDING VALIDATORS =====

export const validateCreateBuilding = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Building name is required")
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 characters"),

  body("buildingType")
    .isIn(["residential", "mixed_use", "hostel", "hotel"])
    .withMessage("Invalid building type"),

  body("address.street")
    .trim()
    .notEmpty()
    .withMessage("Street address is required"),

  body("address.city").trim().notEmpty().withMessage("City is required"),

  body("address.state").trim().notEmpty().withMessage("State is required"),

  body("address.pincode")
    .matches(/^\d{6}$/)
    .withMessage("Invalid pincode format (must be 6 digits)"),

  body("totalFloors")
    .isInt({ min: 1 })
    .withMessage("Building must have at least 1 floor"),

  body("location.coordinates")
    .isArray({ min: 2, max: 2 })
    .withMessage("Coordinates must be [longitude, latitude]")
    .custom((value) => {
      if (value[0] < -180 || value[0] > 180)
        throw new Error("Invalid longitude");
      if (value[1] < -90 || value[1] > 90) throw new Error("Invalid latitude");
      return true;
    }),

  handleValidationErrors,
];

// ===== BOOKING VALIDATORS =====

export const validateCreateBooking = [
  body("roomId")
    .notEmpty()
    .withMessage("Room ID is required")
    .isMongoId()
    .withMessage("Invalid room ID"),

  body("moveInDate")
    .isISO8601()
    .withMessage("Invalid move-in date format")
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error("Move-in date cannot be in the past");
      }
      return true;
    }),

  body("leaseEndDate")
    .isISO8601()
    .withMessage("Invalid lease end date format")
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.moveInDate)) {
        throw new Error("Lease end date must be after move-in date");
      }
      return true;
    }),

  handleValidationErrors,
];

// ===== PAYMENT VALIDATORS =====

export const validateCreatePayment = [
  body("amount").isInt({ min: 1 }).withMessage("Amount must be greater than 0"),

  body("paymentMethod")
    .isIn(["card", "upi", "netbanking", "wallet", "cash"])
    .withMessage("Invalid payment method"),

  body("paymentType")
    .isIn(["rent", "security_deposit", "maintenance", "late_fee"])
    .withMessage("Invalid payment type"),

  body("bookingId")
    .notEmpty()
    .withMessage("Booking ID is required")
    .isMongoId()
    .withMessage("Invalid booking ID"),

  handleValidationErrors,
];

// ===== REVIEW VALIDATORS =====

export const validateCreateReview = [
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("comment")
    .trim()
    .notEmpty()
    .withMessage("Comment is required")
    .isLength({ max: 1000 })
    .withMessage("Comment cannot exceed 1000 characters"),

  body("reviewType")
    .isIn(["room", "building", "user"])
    .withMessage("Invalid review type"),

  handleValidationErrors,
];

export default {
  validateRegister,
  validateLogin,
  validateCreateRoom,
  validateCreateBuilding,
  validateCreateBooking,
  validateCreatePayment,
  validateCreateReview,
  handleValidationErrors,
};
