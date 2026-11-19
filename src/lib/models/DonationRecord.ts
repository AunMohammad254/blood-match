import mongoose, { Schema, Document } from "mongoose";

export interface IDonationRecord extends Document {
  donorId: string;
  requestId?: string;
  recipientName?: string;
  hospital?: string;
  city: string;
  donatedAt: Date;
  units: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const DonationRecordSchema = new Schema<IDonationRecord>(
  {
    donorId: { type: String, required: true, index: true },
    requestId: { type: String, trim: true },
    recipientName: { type: String, trim: true },
    hospital: { type: String, trim: true },
    city: { type: String, required: true },
    donatedAt: { type: Date, default: Date.now },
    units: { type: Number, required: true, default: 1 },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

// Indexes
DonationRecordSchema.index({ donorId: 1, donatedAt: -1 });
DonationRecordSchema.index({ requestId: 1 }, { unique: true, sparse: true });

import { DonationRecordMemoryModel } from "@/lib/db/memoryStore";

const MongooseDonationRecord = mongoose.models.DonationRecord ?? mongoose.model<IDonationRecord>("DonationRecord", DonationRecordSchema);

export const DonationRecord = process.env.MONGODB_URI ? MongooseDonationRecord : (DonationRecordMemoryModel as any);
