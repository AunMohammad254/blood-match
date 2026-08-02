import mongoose, { Schema, Document } from "mongoose";

export interface IErrorLog extends Document {
  route: string;
  message: string;
  stackSummary?: string;
  userRole?: string;
  userId?: mongoose.Types.ObjectId;
  requestId?: string;
  severity: "warn" | "error" | "critical";
  timestamp: Date;
}

const ErrorLogSchema = new Schema<IErrorLog>(
  {
    route: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    stackSummary: { type: String, trim: true },
    userRole: { type: String, default: "unauthenticated" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    requestId: { type: String },
    severity: { type: String, enum: ["warn", "error", "critical"], default: "error" },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ErrorLogSchema.index({ timestamp: -1 });
ErrorLogSchema.index({ route: 1, timestamp: -1 });
ErrorLogSchema.index({ severity: 1, timestamp: -1 });

export const ErrorLog =
  mongoose.models.ErrorLog || mongoose.model<IErrorLog>("ErrorLog", ErrorLogSchema);
