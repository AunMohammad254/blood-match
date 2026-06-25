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

// Auth
export const registerUser = (data: any) => api.post("/auth/register", data);
export const loginUser = (data: any) => api.post("/auth/login", data);

// Donors
export const getDonors = (params?: { bloodType?: string; city?: string }) => api.get("/donors", { params });
export const toggleAvailability = (isAvailable: boolean) => api.patch("/donors/availability", { isAvailable });

// Requests
export const getRequests = (params?: { city?: string; bloodType?: string; status?: string; mine?: boolean; acceptedByMe?: boolean }) => 
  api.get("/requests", { params });
export const createRequest = (data: any) => api.post("/requests", data);
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
