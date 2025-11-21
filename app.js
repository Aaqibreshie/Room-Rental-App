import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import compression from "compression";
import config from "./src/config/config.js";
import {
  securityHeaders,
  sanitizeData,
  preventParamPollution,
} from "./src/middleware/security.middleware.js";
import { errorHandler } from "./src/middleware/error.middleware.js";
import rateLimit from "express-rate-limit";
import logger from "./src/utils/logger.js";
import server from "./server.js";

// Import Routes
import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/user.routes.js";
import roomRoutes from "./src/routes/room.routes.js";
import buildingRoutes from "./src/routes/building.routes.js";
import bookingRoutes from "./src/routes/booking.routes.js";
import paymentRoutes from "./src/routes/payment.routes.js";
import reviewRoutes from "./src/routes/review.routes.js";

const app = express();

// ===== MIDDLEWARE SETUP =====

// Trust proxy
// app.set("trust proxy", 1);

// Logging
// app.use(morgan("dev"));

// Security Middleware
// app.use(securityHeaders);
// app.use(sanitizeData);
// app.use(preventParamPollution);

// CORS Configuration
// app.use(
//   cors({
//     origin: config.FRONTEND_URL,
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// Compression
// app.use(compression());

// Body Parser
// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Cookie Parser
app.use(cookieParser());

// Rate Limiting
// const limiter = rateLimit({
//   windowMs: config.RATE_LIMIT_WINDOW_MS,
//   max: config.RATE_LIMIT_MAX_REQUESTS,
//   message: "Too many requests from this IP, please try again later.",
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// app.use("/api/", limiter);

// ===== API ROUTES =====

// Health Check
// app.get("/api/v1/health", (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: "API is running",
//     timestamp: new Date().toISOString(),
//   });
// });

// API Routes
// app.use(`/api/${config.API_VERSION}/auth`, authRoutes);
// app.use(`/api/${config.API_VERSION}/users`, userRoutes);
// app.use(`/api/${config.API_VERSION}/rooms`, roomRoutes);
// app.use(`/api/${config.API_VERSION}/buildings`, buildingRoutes);
// app.use(`/api/${config.API_VERSION}/bookings`, bookingRoutes);
// app.use(`/api/${config.API_VERSION}/payments`, paymentRoutes);
// app.use(`/api/${config.API_VERSION}/reviews`, reviewRoutes);

// ===== 404 HANDLER =====
// app.use("*", (req, res) => {
//   logger.warn(`404 - Route not found: ${req.originalUrl}`);
//   res.status(404).json({
//     success: false,
//     message: "Route not found",
//     path: req.originalUrl,
//   });
// });

// ===== ERROR HANDLER =====
// app.use(errorHandler);

export default app;
