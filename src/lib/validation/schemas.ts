import { z } from 'zod';
import { BLOOD_TYPES, CITIES, URGENCY_LEVELS, ROLES } from '@/lib/constants';

export const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  // Phone is a required contact field for donor-recipient coordination (not used for OTP verification)
  phone: z.string().min(10, "Phone must be at least 10 digits").max(15),
  bloodType: z.enum(BLOOD_TYPES as unknown as unknown as [string, ...string[]]),
  city: z.enum(CITIES as unknown as unknown as [string, ...string[]]),
  role: z.enum(["donor", "recipient", "patient_attendant", "hospital_verifier"]),
  location: z.object({
    type: z.string().optional(),
    coordinates: z.array(z.number()).length(2)
  }).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

export const CreateRequestSchema = z.object({
  patientName: z.string().min(2).max(100),
  bloodType: z.enum(BLOOD_TYPES as unknown as [string, ...string[]]),
  units: z.number().int().min(1).max(20),
  hospital: z.string().min(3).max(100),
  city: z.string().min(2).max(50),
  urgency: z.enum(URGENCY_LEVELS as unknown as [string, ...string[]]),
  contactPhone: z.string().min(10).max(15),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  city: z.string().min(2).max(50).optional(),
  phone: z.string().min(10).max(15).optional(),
  lastDonatedAt: z.string().datetime().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
}).refine((data: Record<string, any>) => Object.keys(data).length > 0, {
  message: "At least one field must be provided"
});

export const CreateDonationRecordSchema = z.object({
  hospital: z.string().min(2, "Hospital name must be at least 2 characters").max(100),
  city: z.string().min(2, "City must be at least 2 characters").max(50),
  units: z.number().int().min(1, "Units must be at least 1").max(10, "Units cannot exceed 10"),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional().default(""),
  donatedAt: z.string().optional().refine((val: string | undefined) => {
    if (!val) return true;
    const date = new Date(val);
    return !isNaN(date.getTime()) && date <= new Date();
  }, { message: "Donation date cannot be in the future" }),
});
