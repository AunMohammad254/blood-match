import { z } from 'zod';
import { BLOOD_TYPES, CITIES } from '@/lib/constants';

export const StrongPasswordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: StrongPasswordSchema,
  phone: z.string().min(10, "Phone must be at least 10 digits").max(15),
  bloodType: z.enum(BLOOD_TYPES as unknown as [string, ...string[]]),
  city: z.enum(CITIES as unknown as [string, ...string[]]),
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
