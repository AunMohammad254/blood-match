import mongoose, { Schema, Document } from "mongoose";

export interface IVerification extends Document {
  requestId: mongoose.Types.ObjectId;
  verifiedBy: mongoose.Types.ObjectId;
  decision: "approved" | "rejected";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationSchema = new Schema<IVerification>(
  {
    requestId: { type: Schema.Types.ObjectId, ref: "BloodRequest", required: true },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    decision: { type: String, enum: ["approved", "rejected"], required: true },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

// Indexes for fast lookup
VerificationSchema.index({ requestId: 1 });
VerificationSchema.index({ verifiedBy: 1 });

import { VerificationMemoryModel } from "@/lib/db/memoryStore";

const MongooseVerificationModel =
  mongoose.models.Verification ??
  mongoose.model<IVerification>("Verification", VerificationSchema);

export const Verification = process.env.MONGODB_URI
  ? MongooseVerificationModel
  : (VerificationMemoryModel as any);
