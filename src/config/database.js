import mongoose from 'mongoose';
import config from './config.js';
import logger from '../utils/logger.js';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    logger.info('Database already connected');
    return;
  }

  try {
    const mongoUri = config.isTest() ? config.MONGODB_TEST_URI : config.MONGODB_URI;

    const connection = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      socketKeepAliveMS: 30000,
      retryWrites: true,
      w: 'majority'
    });

    isConnected = true;

    logger.info(`✅ MongoDB Connected: ${connection.connection.host}`);
    logger.info(`Database: ${connection.connection.name}`);

    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('error', (err) => {
      logger.error('❌ MongoDB connection error:', err);
    });

    return connection;
  } catch (error) {
    logger.error('❌ Error connecting to MongoDB:', error.message);
    isConnected = false;

    // Retry connection after 5 seconds
    setTimeout(() => connectDB(), 5000);
  }
};

export const disconnectDB = async () => {
  try {
    if (isConnected) {
      await mongoose.disconnect();
      isConnected = false;
      logger.info('MongoDB disconnected');
    }
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
  }
};

export default connectDB;