import mongoose, { Schema, Document } from "mongoose";

export interface IConsent extends Document {
  donorMatchId: mongoose.Types.ObjectId;
  donorId: mongoose.Types.ObjectId;
  requestId: mongoose.Types.ObjectId;
  consentedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConsentSchema = new Schema<IConsent>(
  {
    donorMatchId: { type: Schema.Types.ObjectId, ref: "DonorMatch", required: true },
    donorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    requestId: { type: Schema.Types.ObjectId, ref: "BloodRequest", required: true },
    consentedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ConsentSchema.index({ donorId: 1, requestId: 1 }, { unique: true });
ConsentSchema.index({ requestId: 1 });

import { ConsentMemoryModel } from "@/lib/db/memoryStore";

const MongooseConsentModel =
  mongoose.models.Consent ??
  mongoose.model<IConsent>("Consent", ConsentSchema);

export const Consent = process.env.MONGODB_URI
  ? MongooseConsentModel
  : (ConsentMemoryModel as any);
