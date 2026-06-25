import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

// If MONGODB_URI is not defined, we operate in in-memory fallback mode


// Cache the connection across hot-reloads in development
let cached = (global as any).__mongoose ?? { conn: null, promise: null };
(global as any).__mongoose = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    console.warn("MONGODB_URI is not defined. Operating in Autonomous In-Memory mode.");
    return mongoose;
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
