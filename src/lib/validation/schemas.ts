import { z } from 'zod';
import { BLOOD_TYPES, CITIES, URGENCY_LEVELS, ROLES } from '@/lib/constants';

export const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain uppercase")
    .regex(/[a-z]/, "Password must contain lowercase")
    .regex(/[0-9]/, "Password must contain number"),
  phone: z.string().min(10, "Phone must be at least 10 digits").max(15),
  bloodType: z.enum(BLOOD_TYPES as unknown as unknown as [string, ...string[]]),
  city: z.enum(CITIES as unknown as unknown as [string, ...string[]]),
  role: z.enum(ROLES as unknown as unknown as [string, ...string[]]),
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
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided"
});
