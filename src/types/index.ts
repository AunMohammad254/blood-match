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
  isPhoneVerified: boolean;
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
  phone?: string; // Conditionally included by API — only for admin/coordinator roles
  isAvailable: boolean;
  isPhoneVerified: boolean;
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

export interface AdminStats {
  totalUsers: number;
  totalDonors: number;
  totalRecipients: number;
  totalRequests: number;
  openRequests: number;
  acceptedRequests: number;
  rejectedRequests: number;
  fulfilledRequests: number;
  cancelledRequests: number;
  criticalRequests: number;
  newUsersLast7Days: number;
  bloodTypeDistribution?: { _id: string; count: number }[];
  cityBreakdown?: { _id: string; count: number }[];
  totalChats?: number;
  totalChatMessages?: number;
  recentChats?: Array<{
    _id: string;
    userId: { _id: string; name: string; email: string } | null;
    title: string;
    messages: Array<{ role: string; content: string; model?: string }>;
    updatedAt: string;
  }>;
}
