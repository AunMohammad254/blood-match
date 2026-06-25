import mongoose, { Schema, Document } from "mongoose";
import { BloodType, BLOOD_TYPES, ROLES } from "@/lib/constants";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  bloodType: BloodType;
  city: string;
  role: "donor" | "recipient";
  isAvailable: boolean;
  isPhoneVerified: boolean;
  verificationOtp?: string;
  verificationOtpExpiry?: Date;
  lastDonatedAt?: Date;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    bloodType: { type: String, required: true, enum: BLOOD_TYPES },
    city: { type: String, required: true, trim: true },
    role: { type: String, required: true, enum: ROLES, default: "donor" },
    isAvailable: { type: Boolean, default: true },
    isPhoneVerified: { type: Boolean, default: false },
    verificationOtp: { type: String, required: false },
    verificationOtpExpiry: { type: Date, required: false },
    lastDonatedAt: { type: Date },
    location: {
      type: { type: String, enum: ['Point'], required: false },
      coordinates: { type: [Number], required: false }
    },
  },
  { timestamps: true }
);

// Indexes for fast filtering
UserSchema.index({ bloodType: 1, city: 1 });
UserSchema.index({ role: 1, isAvailable: 1 });
UserSchema.index({ city: 1, bloodType: 1, isAvailable: 1 });
UserSchema.index({ isAvailable: 1, lastDonatedAt: -1 });
UserSchema.index({ verificationOtpExpiry: 1 }, { expireAfterSeconds: 0 }); // Auto cleanup expired OTPs
UserSchema.index({ location: '2dsphere' });

import { UserMemoryModel } from "@/lib/db/memoryStore";

const MongooseUserModel = mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export const User = process.env.MONGODB_URI ? MongooseUserModel : (UserMemoryModel as any);
