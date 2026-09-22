import mongoose from 'mongoose';
import { env } from './env.js';

let reconnectTimer;

export const isDbConnected = () => mongoose.connection.readyState === 1;

export const databaseStatus = () => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return {
    status: states[mongoose.connection.readyState] || 'unknown',
    host: mongoose.connection.host,
    name: mongoose.connection.name
  };
};

export const connectDb = async () => {
  mongoose.set('strictQuery', true);

  if (isDbConnected()) return true;
  if (mongoose.connection.readyState === 2) return false;

  try {
    const connection = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: env.mongoServerSelectionTimeoutMs
    });
    console.log(`MongoDB connected: ${connection.connection.host}`);
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    return false;
  }
};

export const startDbReconnectLoop = () => {
  if (reconnectTimer || isDbConnected()) return;

  reconnectTimer = setInterval(() => {
    if (!isDbConnected()) {
      connectDb();
      return;
    }

    clearInterval(reconnectTimer);
    reconnectTimer = null;
  }, env.mongoReconnectIntervalMs);

  reconnectTimer.unref?.();
};
