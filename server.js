import config from "./src/config/config.js";
import { connectDB } from "./src/config/database.js";
import logger from "./src/utils/logger.js";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
// import mongoSanitize from "express-mongo-sanitize";
import { safeSanitize } from "./src/middleware/security.middleware.js";
import {
  securityHeaders,
  preventParamPollution,
} from "./src/middleware/security.middleware.js";
import { errorHandler } from "./src/middleware/error.middleware.js";
import rateLimit from "express-rate-limit";

// Import Routes
import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/user.routes.js";
import roomRoutes from "./src/routes/room.routes.js";
import buildingRoutes from "./src/routes/building.routes.js";
// import bookingRoutes from "./src/routes/booking.routes.js";
// import paymentRoutes from "./src/routes/payment.routes.js";
// import reviewRoutes from "./src/routes/review.routes.js";

const app = express();

// ===== MIDDLEWARE SETUP =====

// Trust reverse proxies (render, vercel, nginx etc.)
app.set("trust proxy", 1);

// Logging
app.use(morgan("dev"));

// Security Middleware
app.use(securityHeaders);
// app.use(sanitizeData);

app.use(safeSanitize);

app.use(preventParamPollution);
// CORS Setup
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5000"], // your frontend Vite URL
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
  // {
  // origin: config.FRONTEND_URL,
  // credentials: true,
  // }
);
// Logging
app.use(morgan(config.NODE_ENV === "production" ? "combined" : "dev"));

// Enable compression (gzip)
app.use(compression());

// -----Body Parsing-------//
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//-------Cookies----------//
app.use(cookieParser());

// Rate limiting for API security
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // 200 requests / 15 min
  message: "Too many requests. Please try again later.",
});
app.use("/api", limiter);

// app.use("/", (req, res) => {
//   return res.status(200).json("hello from server");
// });
// ---------------------------
//          ROUTES
// ---------------------------
app.get("/", (req, res) => {
  res.status(200).json({ message: "Server running 🚀" });
});
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/buildings", buildingRoutes);

// API Routes
// app.use(`/api/${config.API_VERSION}/users`, userRoutes);
// app.use(`/api/${config.API_VERSION}/rooms`, roomRoutes);
// app.use(`/api/${config.API_VERSION}/buildings`, buildingRoutes);
// app.use(`/api/${config.API_VERSION}/bookings`, bookingRoutes);
// app.use(`/api/${config.API_VERSION}/payments`, paymentRoutes);
// app.use(`/api/${config.API_VERSION}/reviews`, reviewRoutes);

app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR =>", err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ---------------------------
// ERROR HANDLER
// ---------------------------
app.use(errorHandler);

let server;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express Server
    server = app.listen(config.PORT, () => {
      logger.info(`
      ╔════════════════════════════════════════════╗
      ║   🚀 Room Rental Backend Server Started   ║
      ╠════════════════════════════════════════════╣
      ║ 📍 Port: ${config.PORT}
      ║ 🌍 Environment: ${config.NODE_ENV}
      ║ 🔗 API Version: v${config.API_VERSION}
      ║ 🔐 CORS Enabled: ${config.FRONTEND_URL}
      ╚════════════════════════════════════════════╝
      `);
    });

    // Graceful Shutdown
    process.on("SIGTERM", () => {
      logger.info("SIGTERM signal received: closing HTTP server");
      server.close(() => {
        logger.info("HTTP server closed");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      logger.info("SIGINT signal received: closing HTTP server");
      server.close(() => {
        logger.info("HTTP server closed");
        process.exit(0);
      });
    });

    // Unhandled Promise Rejection
    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection at:", promise, "reason:", reason);
      if (server) {
        server.close(() => {
          process.exit(1);
        });
      }
    });

    // Uncaught Exception
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception:", error);
      if (server) {
        server.close(() => {
          process.exit(1);
        });
      }
    });
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default server;
