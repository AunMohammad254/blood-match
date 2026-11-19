import { z } from 'zod';
import { BLOOD_TYPES, CITIES, ROLES } from '@/lib/constants';

export const PUBLIC_REGISTRATION_ROLES = ["donor", "recipient", "patient_attendant"] as const;

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
  role: z.enum(PUBLIC_REGISTRATION_ROLES, {
    errorMap: () => ({
      message:
        "Public registration is only allowed for donor, patient_attendant, or recipient roles. Privileged roles must be assigned by an administrator.",
    }),
  }),
  location: z.object({
    type: z.string().optional(),
    coordinates: z.array(z.number()).length(2)
  }).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const AdminUpdateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").optional(),
  email: z.string().email("Invalid email address.").optional(),
  phone: z.string().min(10, "Phone number must be at least 10 characters.").optional(),
  bloodType: z.enum(BLOOD_TYPES as unknown as [string, ...string[]]).optional(),
  city: z.string().min(2, "City must be at least 2 characters.").optional(),
  role: z.enum(ROLES as unknown as [string, ...string[]]).optional(),
  isAvailable: z.boolean().optional(),
  password: z.string().min(6, "Password must be at least 6 characters.").optional(),
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
