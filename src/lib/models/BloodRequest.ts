import mongoose, { Schema, Document } from "mongoose";
import { BloodType, BLOOD_TYPES, URGENCY_LEVELS, REQUEST_STATUS } from "@/lib/constants";

export interface IBloodRequest extends Document {
  patientName: string;
  bloodType: BloodType;
  units: number;
  hospital: string;
  city: string;
  urgency: "normal" | "urgent" | "critical";
  contactPhone: string;
  requestedBy: mongoose.Types.ObjectId;
  status: "open" | "fulfilled" | "cancelled";
  matchedDonor?: mongoose.Types.ObjectId;
  isVerified: boolean;
  expiresAt?: Date;
  declinedBy: mongoose.Types.ObjectId[];
  reports: number;
  reportedBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const BloodRequestSchema = new Schema<IBloodRequest>(
  {
    patientName: { type: String, required: true, trim: true },
    bloodType: { type: String, required: true, enum: BLOOD_TYPES },
    units: { type: Number, required: true, min: 1, max: 20 },
    hospital: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    urgency: { type: String, required: true, enum: URGENCY_LEVELS, default: "urgent" },
    contactPhone: { type: String, required: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["open", "accepted", "rejected", "fulfilled", "cancelled"], default: "open" },
    matchedDonor: { type: Schema.Types.ObjectId, ref: "User" },
    isVerified: { type: Boolean, required: true, default: false },
    expiresAt: { type: Date },
    declinedBy: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    reports: { type: Number, default: 0 },
    reportedBy: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
  },
  { timestamps: true }
);

// Indexes for common query patterns
BloodRequestSchema.index({ status: 1, createdAt: -1 });
BloodRequestSchema.index({ bloodType: 1, city: 1, status: 1 });
BloodRequestSchema.index({ requestedBy: 1, status: 1 });
BloodRequestSchema.index({ city: 1, urgency: -1, createdAt: -1 });

import { BloodRequestMemoryModel } from "@/lib/db/memoryStore";

const MongooseBloodRequestModel =
  mongoose.models.BloodRequest ??
  mongoose.model<IBloodRequest>("BloodRequest", BloodRequestSchema);

export const BloodRequest = process.env.MONGODB_URI ? MongooseBloodRequestModel : (BloodRequestMemoryModel as any);
