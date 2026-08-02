import { z } from 'zod';
import { BLOOD_TYPES, URGENCY_LEVELS } from '@/lib/constants';

export const CreateRequestSchema = z.object({
  patientName: z.string().min(2).max(100),
  bloodType: z.enum(BLOOD_TYPES as unknown as [string, ...string[]]),
  units: z.number().int().min(1).max(20),
  hospital: z.string().min(3).max(100),
  city: z.string().min(2).max(50),
  urgency: z.enum(URGENCY_LEVELS as unknown as [string, ...string[]]),
  contactPhone: z.string().min(10).max(15),
});
