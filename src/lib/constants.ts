export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodType = typeof BLOOD_TYPES[number];

export const CITIES = [
  "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad",
  "Peshawar", "Quetta", "Multan", "Hyderabad", "Sialkot"
] as const;

export const URGENCY_LEVELS = ["normal", "urgent", "critical"] as const;
export type UrgencyLevel = typeof URGENCY_LEVELS[number];

export const ROLES = ["donor", "recipient", "admin", "coordinator"] as const;
export type Role = typeof ROLES[number];

export const REQUEST_STATUS = ["open", "accepted", "rejected", "fulfilled", "cancelled"] as const;
export type RequestStatus = typeof REQUEST_STATUS[number];

export const COMPATIBILITY_MAP: Record<BloodType, BloodType[]> = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"]
};
