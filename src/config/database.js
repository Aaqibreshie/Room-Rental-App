import mongoose from "mongoose";
import config from "./config.js";
import logger from "../utils/logger.js";

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    logger.info("Database already connected");
    return;
  }

  try {
    const mongoUri = config.isTest()
      ? config.MONGODB_TEST_URI
      : config.MONGODB_URI;

    console.log("🔗 Connecting to:", mongoUri);

    const connection = await mongoose.connect(mongoUri, {
      retryWrites: true,
      w: "majority",
    });

    isConnected = true;

    logger.info(`✅ MongoDB Connected: ${connection.connection.host}`);
    logger.info(`Database: ${connection.connection.name}`);

    mongoose.connection.on("disconnected", () => {
      logger.warn("⚠️ MongoDB disconnected");
      isConnected = false;
    });

    mongoose.connection.on("error", (err) => {
      logger.error("❌ MongoDB connection error:", err);
    });

    return connection;
  } catch (error) {
    logger.error("❌ Error connecting to MongoDB:", error.message);
    isConnected = false;

    setTimeout(() => connectDB(), 5000);
  }
};

export default connectDB;
