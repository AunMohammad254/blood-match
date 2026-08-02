import { z } from 'zod';

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
