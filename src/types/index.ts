import { BloodType, Role, UrgencyLevel, RequestStatus } from "@/lib/constants";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  bloodType: BloodType;
  city: string;
  phone: string;
  isAvailable: boolean;
  lastDonatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Donor {
  _id: string;
  name: string;
  email?: string;
  role: Role;
  bloodType: BloodType;
  city: string;
  phone: string;
  isAvailable: boolean;
  lastDonatedAt?: string;
  createdAt?: string;
}

export interface RecipientRequest {
  _id: string;
  patientName: string;
  bloodType: BloodType;
  units: number;
  hospital: string;
  city: string;
  urgency: UrgencyLevel;
  contactPhone: string;
  requestedBy: {
    _id?: string;
    name: string;
    city: string;
  } | string;
  status: RequestStatus;
  matchedDonor?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MatchResponse {
  requested: BloodType;
  compatibleTypes: BloodType[];
  totalMatches: number;
  donors: Donor[];
}

export interface RequestsResponse {
  requests: RecipientRequest[];
}
