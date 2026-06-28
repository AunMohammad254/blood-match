import axios from "axios";
import { getToken, logout } from "./auth";
import { BloodType } from "./constants";

const api = axios.create({ baseURL: "/api" });

// Auto-attach JWT on every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      logout();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  bloodType: BloodType;
  city: string;
  role: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

// Auth
export const registerUser = (data: RegisterPayload) => api.post("/auth/register", data);
export const loginUser = (data: LoginPayload) => api.post("/auth/login", data);

// Donors
export const getDonors = (params?: { bloodType?: string; city?: string }) => api.get("/donors", { params });
export const toggleAvailability = (isAvailable: boolean) => api.patch("/donors/availability", { isAvailable });

// Requests
export const getRequests = (params?: { city?: string; bloodType?: string; status?: string; mine?: boolean; acceptedByMe?: boolean }) => 
  api.get("/requests", { params });
interface CreateRequestPayload {
  patientName: string;
  bloodType: BloodType;
  units: number;
  hospital: string;
  city: string;
  urgency: "normal" | "urgent" | "critical";
  contactPhone: string;
}

export const createRequest = (data: CreateRequestPayload) => api.post("/requests", data);
export const cancelRequest = (id: string) => api.patch(`/requests/${id}/cancel`);
export const respondToRequest = (id: string, action: "accept" | "decline") => api.patch(`/requests/${id}/respond`, { action });
export const reportRequest = (id: string) => api.post(`/requests/${id}/report`);

// Match
export const matchDonors = (
  bloodType: BloodType, 
  city?: string, 
  lat?: number, 
  lng?: number, 
  maxDistance?: number,
  includeUnavailable?: boolean,
  ignoreCooldown?: boolean
) =>
  api.get("/match", { params: { bloodType, city, lat, lng, maxDistance, includeUnavailable, ignoreCooldown } });

export default api;
