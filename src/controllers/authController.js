import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Room from "../models/Room.js";
import {
  generateTokens,
  setTokenCookies,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { sendEmail } from "../services/email.service.js";
import crypto from "crypto";

// Register User

export const registerUser = asyncHandler(async (req, res, next) => {
  const {
    fullName,
    email,
    phone,
    password,
    role,
    // gender,
    // dateOfBirth,
    // bio,
    // street,
    // city,
    // state,
    // zipCode,
    // country,
  } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { phone }],
  });

  if (existingUser) {
    throw new ApiError("Email or phone number already registered", 409);
  }

  // Create new user
  const user = new User({
    fullName,
    email: email.toLowerCase(),
    phone,
    password,
    role: role || "tenant",
    // gender: gender || null,
    // dateOfBirth: dateOfBirth || null,
    // bio: bio || "",
    // address: {
    //   street: street || "",
    //   city: city || "",
    //   state: state || "",
    //   zipCode: zipCode || "",
    //   country: country || "",
    // },
  });

  await user.save();

  const { accessToken, refreshToken } = generateTokens(user._id);

  setTokenCookies(res, accessToken, refreshToken);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        user: user.getPublicProfile(),
        // role: user.role,
        accessToken,
        refreshToken,
      },
      "User registered successfully"
    )
  );
});

/**
 * Login User
 */
export const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError("Please provide email and password", 400);
  }

  // Find user with password field
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password"
  );

  if (!user) {
    throw new ApiError("Invalid email or password", 401);
  }

  // Compare passwords
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new ApiError("Invalid email or password", 401);
  }

  if (user.isBanned) {
    throw new ApiError(
      `Account banned. Reason: ${user.banReason || "No reason provided"}`,
      403
    );
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Set cookies
  // setTokenCookies(res, accessToken, refreshToken);

  // Save refresh token and update last login
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        user: user.getPublicProfile(),
        role: user.role,
        accessToken,
        refreshToken,
      },
      "Login successful"
    )
  );
});

/**
 * Logout User
 */
export const logoutUser = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  // Clear refresh token from database
  await User.findByIdAndUpdate(userId, {
    $unset: { refreshToken: 1 },
  });

  // Clear cookies
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
});

/**
 * Get User Profile
 */
export const getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate("savedBuildings"); // ⬅ keep this

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  const profile = user.getPublicProfile();

  // ✅ normalize savedRooms → ALWAYS IDs
  profile.savedRooms = (user.savedRooms || []).map((id) => id.toString());

  res
    .status(200)
    .json(new ApiResponse(200, profile, "Profile retrieved successfully"));
});

/**
 * Update User Profile
 */
// export const updateProfile = asyncHandler(async (req, res, next) => {
//   const { fullName, bio, dateOfBirth, gender, address, profilePicture } =
//     req.body;

//   const user = await User.findByIdAndUpdate(
//     req.user._id,
//     {
//       fullName,
//       bio,
//       dateOfBirth,
//       gender,
//       address,
//       profilePicture,
//     },
//     { new: true, runValidators: true }
//   );

//   res
//     .status(200)
//     .json(
//       new ApiResponse(
//         200,
//         user.getPublicProfile(),
//         "Profile updated successfully"
//       )
//     );
// });

export const updateProfile = asyncHandler(async (req, res) => {
  console.log("REQ BODY:", req.body);

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // ---- BASIC FIELDS (Safe Assign) ----
  if (req.body.fullName !== undefined) user.fullName = req.body.fullName;
  if (req.body.bio !== undefined) user.bio = req.body.bio;
  if (req.body.gender !== undefined) user.gender = req.body.gender;
  if (req.body.dateOfBirth !== undefined)
    user.dateOfBirth = req.body.dateOfBirth;

  // ---- ADDRESS FIX (Your UI sends only a single text field) ----
  if (req.body.address !== undefined) {
    user.address = {
      street: user.address?.street || "",
      city: req.body.address, // ← your UI sends this
      state: user.address?.state || "",
      zipCode: user.address?.zipCode || "",
      country: user.address?.country || "",
    };
  }

  // ---- REMOVE OLD IMAGE ----
  if (req.body.removeImage === "1") {
    user.profilePicture = null;
  }

  // ---- NEW IMAGE UPLOAD ----
  if (req.file) {
    user.profilePicture = req.file.path; // cloudinary URL
  }

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user,
  });
});

/**
 * Change Password
 */
export const changePassword = asyncHandler(async (req, res, next) => {
  console.log("Change Password REQ BODY:", req.body);
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new ApiError("Please provide all password fields", 400);
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError("New passwords do not match", 400);
  }

  if (newPassword.length < 6) {
    throw new ApiError("Password must be at least 6 characters", 400);
  }

  // Get user with password
  const user = await User.findById(req.user._id).select("+password");

  // Verify current password
  const isPasswordCorrect = await user.comparePassword(currentPassword);
  if (!isPasswordCorrect) {
    throw new ApiError("Current password is incorrect", 400);
  }

  // Check if new password is same as current
  const isSamePassword = await user.comparePassword(newPassword);
  if (isSamePassword) {
    throw new ApiError(
      "New password must be different from current password",
      400
    );
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

/**
 * Forgot Password
 */
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError("Please provide an email address", 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, null, "If email exists, password reset link sent")
      );
  }

  // Generate reset token for URL
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHashed = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.resetPasswordToken = resetTokenHashed;
  user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  user.resetPasswordOtp = otp;
  user.resetPasswordOtpExpire = new Date(Date.now() + 10 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      template: "forgotPassword",
      email: user.email,
      subject: "Room Rental - Password Reset Link & OTP",
      data: {
        name: user.fullName,
        resetUrl,
        expiryTime: "10 minutes",
        otp,
      },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          null,
          "Password reset link and OTP sent to your email"
        )
      );
  } catch (error) {
    console.error("SEND EMAIL ERROR:", error);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpire = undefined;
    await user.save({ validateBeforeSave: false });

    throw new ApiError("Error sending email. Please try again later.", 500);
  }
});

/** Verify Reset OTP
 */
export const verifyResetOtp = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError("Please provide email and OTP", 400);
  }

  const user = await User.findOne({
    email: email.toLowerCase(),
    resetPasswordOtp: otp,
    resetPasswordOtpExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError("Invalid or expired OTP", 400);
  }

  // Clear OTP fields (so it can't be reused)
  user.resetPasswordOtp = undefined;
  user.resetPasswordOtpExpire = undefined;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(
      200,
      { resetToken: user.resetPasswordToken }, // or the plain token if you store it
      "OTP verified successfully"
    )
  );
});

/**
 * Reset Password
 */
export const resetPassword = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    throw new ApiError("Please provide password and confirm password", 400);
  }

  if (password !== confirmPassword) {
    throw new ApiError("Passwords do not match", 400);
  }

  if (password.length < 6) {
    throw new ApiError("Password must be at least 6 characters", 400);
  }

  // Hash token
  // const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpire: { $gt: Date.now() },
  }).select("+password");

  if (!user) {
    throw new ApiError("Password reset token is invalid or has expired", 400);
  }

  // Check if same as current
  const isSamePassword = await user.comparePassword(password);
  if (isSamePassword) {
    throw new ApiError("New password cannot be the same as old password", 400);
  }

  // Update password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  // Generate new tokens and auto-login
  const { accessToken, refreshToken } = generateTokens(user._id);
  setTokenCookies(res, accessToken, refreshToken);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        user: user.getPublicProfile(),
        accessToken,
        refreshToken,
      },
      "Password reset successfully. You are now logged in."
    )
  );
});

/**
 * Refresh Token
 */
export const refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new ApiError("Refresh token is required", 400);
  }

  try {
    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      throw new ApiError("Invalid refresh token", 401);
    }

    // Generate new tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    setTokenCookies(res, accessToken, refreshToken);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError("Invalid refresh token", 401);
  }
});

/**
 * Save / Unsave Room
 * POST /api/auth/saved-rooms/:roomId
 */
export const toggleSaveRoom = asyncHandler(async (req, res) => {
  console.log("save button clicked");
  const user = await User.findById(req.user._id);
  const { roomId } = req.params;

  const room = await Room.findById(roomId);
  if (!room) {
    throw new ApiError("Room not found", 404);
  }
  if (room.owner?.toString() === req.user._id.toString()) {
    throw new ApiError("You cannot save your own room", 400);
  }

  const alreadySaved = user.savedRooms.some((id) => id.toString() === roomId);

  if (alreadySaved) {
    user.savedRooms.pull(roomId);
  } else {
    user.savedRooms.push(roomId);
  }

  await user.save();

  res.status(200).json(
    new ApiResponse(
      200,
      {
        saved: !alreadySaved,
        savedRooms: user.savedRooms,
      },
      alreadySaved ? "Room removed from saved" : "Room saved"
    )
  );
});
/**
 * Get Saved Rooms
 * GET /api/auth/saved-rooms
 */
export const getSavedRooms = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "savedRooms",
    populate: { path: "building" }, // optional
  });

  res
    .status(200)
    .json(new ApiResponse(200, user.savedRooms, "Saved rooms fetched"));
});

export default {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  refreshToken,
  toggleSaveRoom,
  getSavedRooms,
  verifyResetOtp,
};
