import mongoose from "mongoose";
import { logger } from "@/lib/logger";

const MONGODB_URI = process.env.MONGODB_URI as string;

// If MONGODB_URI is not defined, we operate in in-memory fallback mode


declare global {
  var __mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

let cached = global.__mongoose ?? { conn: null, promise: null };
global.__mongoose = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    logger.warn("MONGODB_URI is not defined. Operating in Autonomous In-Memory mode.");
    return mongoose;
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err: any) {
    cached.promise = null;
    console.error("MongoDB connection failed. If you don't have a valid MongoDB cluster, remove MONGODB_URI from your .env file to use in-memory fallback.");
    throw err;
  }

  return cached.conn;
}
