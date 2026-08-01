"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/auth";
import { User, RecipientRequest } from "@/types";
import { getRequests } from "@/lib/api";
import { BloodTypeBadge } from "@/components/BloodTypeBadge";
import { RequestCardSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw, FileText, Info } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export default function VerificationQueuePage() {
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<RecipientRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal state for verification action
  const [selectedRequest, setSelectedRequest] = useState<RecipientRequest | null>(null);
  const [decision, setDecision] = useState<"approved" | "rejected">("approved");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const router = useRouter();

  useEffect(() => {
    const currentUser = getUser();
    if (currentUser) {
      if (currentUser.role !== "hospital_verifier" && currentUser.role !== "admin") {
        toast.error("Access restricted to Hospital Verifiers and Administrators.");
        router.push("/dashboard");
        return;
      }
      setUser(currentUser);
      fetchPendingRequests();
    } else {
      router.push("/login");
    }
  }, [router]);

  const fetchPendingRequests = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await getRequests({ status: "pending" });
      setRequests(res.data.requests || []);
    } catch (err: any) {
      logger.error("Failed to fetch verification queue", err);
      setError("Failed to load verification queue. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (req: RecipientRequest, defaultDecision: "approved" | "rejected") => {
    setSelectedRequest(req);
    setDecision(defaultDecision);
    setNotes("");
    setModalError("");
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setModalError("");

    if (decision === "rejected" && !notes.trim()) {
      setModalError("Actionable rejection notes are required when rejecting a request.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/requests/${selectedRequest._id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          decision,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Request ${decision} successfully.`);
        setSelectedRequest(null);
        fetchPendingRequests();
      } else {
        setModalError(data.error || "Failed to process verification.");
      }
    } catch (err: any) {
      logger.error("Verification submit error", err);
      setModalError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
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
              <span className="bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                Hospital Verifier Queue
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Blood Request Verification
            </h1>
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mt-1">
              Review patient details and verify authenticity before matching with donors
            </p>
          </div>

          <button
            onClick={fetchPendingRequests}
            className="p-3 rounded-2xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 transition flex items-center justify-center gap-2 text-xs font-bold"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh Queue</span>
          </button>
        </div>

        {/* Queue Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>Pending Requests ({requests.length})</span>
            </h2>
          </div>

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
              title="Verification Queue Clear"
              message="There are currently no pending blood requests waiting for verification."
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

                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-gray-100 dark:border-slate-800">
                      <span>Units Needed: <strong className="text-gray-900 dark:text-white">{req.units}</strong></span>
                      <span>• Urgency: <strong className="text-red-600 uppercase">{req.urgency}</strong></span>
                      <span>• Contact: <strong className="text-gray-900 dark:text-white">{req.contactPhone}</strong></span>
                    </div>

                    {req.requestedBy && (
                      <p className="text-[11px] font-semibold text-gray-400 dark:text-slate-500">
                        Submitted by Attendant: {typeof req.requestedBy === "object" ? req.requestedBy.name : req.requestedBy}
                      </p>
                    )}
                  </div>

                  <div className="pt-6 mt-6 border-t border-gray-100 dark:border-slate-800 flex items-center gap-3">
                    <button
                      onClick={() => handleOpenModal(req, "approved")}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleOpenModal(req, "rejected")}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-red-500/20"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Verification Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 sm:p-8 relative">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${decision === "approved" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" : "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"}`}>
                {decision === "approved" ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {decision === "approved" ? "Approve Blood Request" : "Reject Blood Request"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {selectedRequest.patientName} — {selectedRequest.hospital}
                </p>
              </div>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-2xl flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-400">
                <Info className="w-4 h-4 shrink-0 text-red-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Verification Decision
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecision("approved")}
                    className={`py-3 px-4 rounded-2xl text-xs font-black border transition flex items-center justify-center gap-1.5 ${decision === "approved" ? "bg-emerald-600 text-white border-transparent shadow-md shadow-emerald-500/20" : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"}`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision("rejected")}
                    className={`py-3 px-4 rounded-2xl text-xs font-black border transition flex items-center justify-center gap-1.5 ${decision === "rejected" ? "bg-red-600 text-white border-transparent shadow-md shadow-red-500/20" : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"}`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Verifier Notes {decision === "rejected" && <strong className="text-red-600">* Required</strong>}</span>
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={decision === "rejected" ? "Specify reason for rejection (e.g. invalid hospital contact, duplicate request)..." : "Optional verification note..."}
                  required={decision === "rejected"}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
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
                  className={`w-2/3 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider transition shadow-lg ${decision === "approved" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" : "bg-red-600 hover:bg-red-700 shadow-red-500/20"}`}
                >
                  {isSubmitting ? "Processing..." : decision === "approved" ? "Confirm Approval" : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
