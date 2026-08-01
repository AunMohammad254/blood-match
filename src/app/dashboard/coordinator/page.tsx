"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/auth";
import { User, RecipientRequest } from "@/types";
import { getRequests } from "@/lib/api";
import { BloodTypeBadge } from "@/components/BloodTypeBadge";
import { RequestCardSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { REQUEST_STATUS, CITIES, BLOOD_TYPES } from "@/lib/constants";
import { Activity, RefreshCw, AlertCircle, ShieldAlert, CheckCircle2, SlidersHorizontal, ArrowRight, History, HeartHandshake, PhoneCall } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export default function CoordinatorDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<RecipientRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedBloodType, setSelectedBloodType] = useState<string>("all");

  // Status Modal state
  const [selectedRequest, setSelectedRequest] = useState<RecipientRequest | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>("contacted");
  const [overrideReason, setOverrideReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const router = useRouter();

  const fetchCoordinatorRequests = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params: any = {};
      if (selectedStatus !== "all") params.status = selectedStatus;
      if (selectedCity !== "all") params.city = selectedCity;
      if (selectedBloodType !== "all") params.bloodType = selectedBloodType;

      const res = await getRequests(params);
      setRequests(res.data.requests || []);
    } catch (err: any) {
      logger.error("Failed to fetch coordinator requests", err);
      setError("Failed to load requests pipeline. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, selectedCity, selectedBloodType]);

  useEffect(() => {
    const currentUser = getUser();
    if (currentUser) {
      if (currentUser.role !== "coordinator" && currentUser.role !== "admin") {
        toast.error("Access restricted to Coordinators and Administrators.");
        router.push("/dashboard");
        return;
      }
      setUser(currentUser);
      fetchCoordinatorRequests();
    } else {
      router.push("/login");
    }
  }, [router, fetchCoordinatorRequests]);

  const handleOpenStatusModal = (req: RecipientRequest) => {
    setSelectedRequest(req);
    setTargetStatus(req.status === "matched" ? "contacted" : req.status === "contacted" ? "committed" : "fulfilled");
    setOverrideReason("");
    setModalError("");
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setModalError("");

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/requests/${selectedRequest._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: targetStatus,
          reason: overrideReason.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Request status updated to '${targetStatus}'.`);
        setSelectedRequest(null);
        fetchCoordinatorRequests();
      } else {
        setModalError(data.error || "Failed to update status.");
      }
    } catch (err: any) {
      logger.error("Status update submit error", err);
      setModalError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300";
      case "verified": return "bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300";
      case "matched": return "bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300";
      case "contacted": return "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300";
      case "committed": return "bg-teal-100 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300";
      case "donated": return "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300";
      case "fulfilled": return "bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300";
      case "rejected": return "bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300";
      case "cancelled": return "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-400";
      default: return "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-400";
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 animate-fadeIn">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                Coordinator Command Center
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Fulfillment Pipeline
            </h1>
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mt-1">
              Track matches, monitor donor responses, and drive fulfillment across the 8-state pipeline
            </p>
          </div>

          <button
            onClick={fetchCoordinatorRequests}
            className="p-3 rounded-2xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 transition flex items-center justify-center gap-2 text-xs font-bold"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-4 sm:p-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider">
            <SlidersHorizontal className="w-4 h-4 text-purple-600" />
            <span>Filter Pipeline:</span>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-slate-300"
            >
              <option value="all">All Statuses</option>
              {REQUEST_STATUS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-slate-300"
            >
              <option value="all">All Cities</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={selectedBloodType}
              onChange={(e) => setSelectedBloodType(e.target.value)}
              className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-slate-300"
            >
              <option value="all">All Blood Types</option>
              {BLOOD_TYPES.map((bt) => (
                <option key={bt} value={bt}>{bt}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-2xl flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RequestCardSkeleton />
              <RequestCardSkeleton />
            </div>
          ) : requests.length === 0 ? (
            <EmptyState
              title="No Requests in Pipeline"
              message="No blood requests match your current filter criteria."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requests.map((req: any) => (
                <div
                  key={req._id}
                  className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-black text-gray-900 dark:text-white">
                          {req.patientName}
                        </h3>
                        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mt-0.5">
                          {req.hospital}, {req.city}
                        </p>
                      </div>
                      <BloodTypeBadge type={req.bloodType} />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${getStatusColor(req.status)}`}>
                        {req.status}
                      </span>
                      <span className="text-xs font-bold text-gray-600 dark:text-slate-400">
                        • {req.units} units
                      </span>
                      <span className="text-xs font-bold text-red-600 uppercase">
                        • {req.urgency}
                      </span>
                    </div>

                    {req.contactPhone ? (
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Contact: {req.contactPhone}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] font-semibold text-gray-400 dark:text-slate-500">
                        🔒 Contact phone gated (awaiting donor consent)
                      </p>
                    )}
                  </div>

                  <div className="pt-6 mt-6 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 font-semibold">
                      Created {new Date(req.createdAt).toLocaleDateString()}
                    </span>

                    <button
                      onClick={() => handleOpenStatusModal(req)}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-black px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 transition shadow-md shadow-purple-500/20"
                    >
                      <span>Update Pipeline</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Status Update Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 sm:p-8 relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Update Request Status
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {selectedRequest.patientName} (Current: {selectedRequest.status})
                </p>
              </div>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-2xl flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Target Pipeline Status
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {REQUEST_STATUS.map((s) => (
                    <option key={s} value={s}>{s.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Audit / Override Reason (Logged)
                </label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Notes explaining why status is being updated..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="w-1/3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3.5 rounded-2xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 bg-purple-600 hover:bg-purple-700 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider transition shadow-lg shadow-purple-500/20"
                >
                  {isSubmitting ? "Updating..." : "Confirm Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
