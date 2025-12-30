import jwt from "jsonwebtoken";
import config from "../config/config.js";

// Generate Access Token
export const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE,
  });
};

// Generate Refresh Token
export const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRE,
  });
};

// Generate Both Tokens
export const generateTokens = (userId) => {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);

  return { accessToken, refreshToken };
};

// Verify Access Token
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired access token");
  }
};

// Verify Refresh Token
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
};

// Decode Token (without verification)
export const decodeToken = (token) => {
  return jwt.decode(token);
};

// Set Token Cookies
export const setTokenCookies = (res, accessToken, refreshToken) => {
  const cookieOptions = {
    httpOnly: true,
    secure: false, // Set to true if using HTTPS
    sameSite: "none",
    path: "/",
  };

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, cookieOptions);
};

// Clear Token Cookies
export const clearTokenCookies = (res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
};

export default {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  setTokenCookies,
  clearTokenCookies,
};
