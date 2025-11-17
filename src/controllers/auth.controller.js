import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  generateTokens,
  setTokenCookies,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { sendEmail } from "../services/email.service.js";
import crypto from "crypto";

/**
 * Register User
 */
export const registerUser = asyncHandler(async (req, res, next) => {
  const { fullName, email, phone, password, role } = req.body;

  // Check if user already exists
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
  });

  await user.save();

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Set cookies
  setTokenCookies(res, accessToken, refreshToken);

  // Save refresh token
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Send welcome email
  try {
    await sendEmail({
      email: user.email,
      subject: "Welcome to Room Rental Platform",
      template: "welcome",
      data: {
        name: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log("Email send failed but user registered");
  }

  res.status(201).json(
    new ApiResponse(
      201,
      {
        user: user.getPublicProfile(),
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
  setTokenCookies(res, accessToken, refreshToken);

  // Save refresh token and update last login
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        user: user.getPublicProfile(),
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
  const user = await User.findById(req.user._id)
    .populate("savedRooms")
    .populate("savedBuildings");

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user.getPublicProfile(),
        "Profile retrieved successfully"
      )
    );
});

/**
 * Update User Profile
 */
export const updateProfile = asyncHandler(async (req, res, next) => {
  const { fullName, bio, dateOfBirth, gender, address, profilePicture } =
    req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      fullName,
      bio,
      dateOfBirth,
      gender,
      address,
      profilePicture,
    },
    { new: true, runValidators: true }
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user.getPublicProfile(),
        "Profile updated successfully"
      )
    );
});

/**
 * Change Password
 */
export const changePassword = asyncHandler(async (req, res, next) => {
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

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash token
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Room Rental - Password Reset Link",
      template: "forgotPassword",
      data: {
        name: user.fullName,
        resetUrl,
        expiryTime: "10 minutes",
      },
    });

    res
      .status(200)
      .json(
        new ApiResponse(200, null, "Password reset link sent to your email")
      );
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    throw new ApiError("Error sending email. Please try again later.", 500);
  }
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
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

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
};
