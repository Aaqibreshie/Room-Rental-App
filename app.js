// app.js — PRODUCTION READY

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";

import config from "./src/config/config.js";

// Security middlewares
import {
  securityHeaders,
  sanitizeData,
  preventParamPollution,
} from "./src/middleware/security.middleware.js";

import { errorHandler } from "./src/middleware/error.middleware.js";

// Routes
import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/user.routes.js";
import roomRoutes from "./src/routes/room.routes.js";
import buildingRoutes from "./src/routes/building.routes.js";
import bookingRoutes from "./src/routes/booking.routes.js";
import paymentRoutes from "./src/routes/payment.routes.js";
import reviewRoutes from "./src/routes/review.routes.js";

const app = express();

// ---------------------------
// GLOBAL MIDDLEWARES
// ---------------------------

// Trust reverse proxies (render, vercel, nginx etc.)
app.set("trust proxy", 1);

// Security headers
app.use(securityHeaders);

// Sanitize from NoSQL injection
app.use(sanitizeData);

// Prevent parameter pollution
app.use(preventParamPollution);

// CORS Setup
app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true,
  })
);

// Logging
app.use(morgan(config.NODE_ENV === "production" ? "combined" : "dev"));

// Enable compression (gzip)
app.use(compression());

// Request body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookies
app.use(cookieParser());

// Rate limiting for API security
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // 200 requests / 15 min
  message: "Too many requests. Please try again later.",
});
app.use("/api", limiter);

// ---------------------------
// ROUTES
// ---------------------------

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server running 🚀" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/buildings", buildingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);

// ---------------------------
// 404 ROUTE HANDLER
// ---------------------------
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// ---------------------------
// ERROR HANDLER
// ---------------------------
app.use(errorHandler);

export default app;
