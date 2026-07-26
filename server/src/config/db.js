import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDb = async () => {
  mongoose.set('strictQuery', true);

  try {
    const connection = await mongoose.connect(env.mongoUri);
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};
