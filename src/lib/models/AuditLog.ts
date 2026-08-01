import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
  action: string;
  performedBy: mongoose.Types.ObjectId;
  targetId?: mongoose.Types.ObjectId;
  details?: any;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true, trim: true },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetId: { type: Schema.Types.ObjectId },
    details: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ performedBy: 1 });

import { AuditLogMemoryModel } from "@/lib/db/memoryStore";

const MongooseAuditLogModel =
  mongoose.models.AuditLog ??
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export const AuditLog = process.env.MONGODB_URI
  ? MongooseAuditLogModel
  : (AuditLogMemoryModel as any);
