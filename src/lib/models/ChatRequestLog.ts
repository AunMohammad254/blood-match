import mongoose, { Schema, Document } from "mongoose";

export interface IChatRequestLog extends Document {
  ip: string;
  modelName: string;
  timestamp: Date;
}

const ChatRequestLogSchema = new Schema<IChatRequestLog>({
  ip: { type: String, required: true },
  modelName: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

// TTL Index: automatically expire documents 60 seconds after their timestamp
ChatRequestLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 });

// Compound index for efficient querying of request counts
ChatRequestLogSchema.index({ ip: 1, modelName: 1, timestamp: -1 });

export const ChatRequestLog =
  mongoose.models.ChatRequestLog ??
  mongoose.model<IChatRequestLog>("ChatRequestLog", ChatRequestLogSchema);
