import mongoose, { Schema, Document } from "mongoose";

export interface IDonorMatch extends Document {
  requestId: mongoose.Types.ObjectId;
  donorId: mongoose.Types.ObjectId;
  rank: number;
  status: "pending" | "accepted" | "declined";
  matchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DonorMatchSchema = new Schema<IDonorMatch>(
  {
    requestId: { type: Schema.Types.ObjectId, ref: "BloodRequest", required: true },
    donorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rank: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
    matchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index to ensure uniqueness per request & donor
DonorMatchSchema.index({ requestId: 1, donorId: 1 }, { unique: true });
DonorMatchSchema.index({ requestId: 1, status: 1 });
DonorMatchSchema.index({ donorId: 1, status: 1 });

import { DonorMatchMemoryModel } from "@/lib/db/memoryStore";

const MongooseDonorMatchModel =
  mongoose.models.DonorMatch ??
  mongoose.model<IDonorMatch>("DonorMatch", DonorMatchSchema);

export const DonorMatch = process.env.MONGODB_URI
  ? MongooseDonorMatchModel
  : (DonorMatchMemoryModel as any);
