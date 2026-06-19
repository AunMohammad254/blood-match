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
  lastDonatedAt?: Date;
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
    role: { type: String, required: true, enum: ["donor", "recipient", "admin"], default: "donor" },
    isAvailable: { type: Boolean, default: true },
    lastDonatedAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for fast filtering
UserSchema.index({ bloodType: 1, city: 1 });
UserSchema.index({ role: 1, isAvailable: 1 });

import { UserMemoryModel } from "@/lib/db/memoryStore";

const MongooseUserModel = mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export const User = process.env.MONGODB_URI ? MongooseUserModel : (UserMemoryModel as any);
