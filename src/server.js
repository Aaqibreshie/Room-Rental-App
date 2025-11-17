import app from "./app.js";
import config from "./config/config.js";
import { connectDB } from "./config/database.js";
import logger from "./utils/logger.js";

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
});

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
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
});

startServer();

export default server;
