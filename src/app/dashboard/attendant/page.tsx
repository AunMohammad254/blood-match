"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/auth";
import { User, RecipientRequest } from "@/types";
import { getRequests, cancelRequest } from "@/lib/api";
import { BloodTypeBadge } from "@/components/BloodTypeBadge";
import { RequestCardSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { PlusCircle, Activity, ShieldCheck, ShieldAlert, Clock, AlertCircle, RefreshCw, CheckCircle2, HeartHandshake } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export default function AttendantDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<RecipientRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const currentUser = getUser();
    if (currentUser) {
      if (currentUser.role === "admin" || currentUser.role === "coordinator") {
        router.push("/admin");
        return;
      }
      setUser(currentUser);
      fetchRequests();
    } else {
      router.push("/login");
    }
  }, [router]);

  const fetchRequests = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await getRequests({ mine: true });
      setRequests(res.data.requests || []);
    } catch (err: any) {
      logger.error("Failed to fetch attendant requests", err);
      setError("Failed to load your requests. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async (id: string) => {
    try {
      await cancelRequest(id);
      toast.success("Request cancelled.");
      fetchRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to cancel request.");
    }
  };

  const getStatusBadge = (status: string, isVerified: boolean) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs px-2.5 py-1 rounded-full font-bold">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            <span>Pending Verification</span>
          </span>
        );
      case "verified":
      case "open":
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 text-xs px-2.5 py-1 rounded-full font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Verified & Open</span>
          </span>
        );
      case "matched":
        return (
          <span className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 text-xs px-2.5 py-1 rounded-full font-bold">
            <HeartHandshake className="w-3.5 h-3.5 text-purple-600" />
            <span>Donors Matched</span>
          </span>
        );
      case "fulfilled":
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs px-2.5 py-1 rounded-full font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Fulfilled</span>
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-xs px-2.5 py-1 rounded-full font-bold">
            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
            <span>Rejected</span>
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-400 text-xs px-2.5 py-1 rounded-full font-bold">
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-400 text-xs px-2.5 py-1 rounded-full font-bold">
            <span>{status}</span>
          </span>
        );
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
              <span className="bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                Patient Attendant Command
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Emergency Request Overview
            </h1>
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mt-1">
              Manage and track blood requests for your patients in real time
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchRequests}
              className="p-3 rounded-2xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 transition"
              title="Refresh requests"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>

            <Link
              href="/dashboard/request/new"
              className="btn-primary px-5 py-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Blood Request</span>
            </Link>
          </div>
        </div>

        {/* Request List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-600" />
              <span>Your Requests ({requests.length})</span>
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
              title="No Blood Requests Submitted"
              message="You haven't submitted any emergency blood requests yet. Click the button below to post a request for your patient."
              actionLabel="Create Request"
              actionHref="/dashboard/request/new"
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

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {getStatusBadge(req.status, req.isVerified)}
                      <span className="text-xs font-bold text-gray-600 dark:text-slate-400">
                        • {req.units} {req.units === 1 ? "unit" : "units"}
                      </span>
                      <span className="text-xs font-bold text-red-600 uppercase">
                        • {req.urgency}
                      </span>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-gray-400 dark:text-slate-500 font-semibold">
                      Created {new Date(req.createdAt).toLocaleDateString()}
                    </span>

                    {(req.status === "pending" || req.status === "open") && (
                      <button
                        onClick={() => handleCancelRequest(req._id)}
                        className="text-red-600 dark:text-red-400 hover:underline font-bold"
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
