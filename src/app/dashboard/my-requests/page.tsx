"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { RecipientRequest } from "@/types";
import { getRequests, cancelRequest } from "@/lib/api";
import { RequestCard } from "@/components/RequestCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { PlusCircle, AlertCircle } from "lucide-react";

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<RecipientRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await getRequests({ mine: true, status: "all" });
      setRequests(res.data.requests || []);
    } catch (err: any) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async (id: string) => {
    await cancelRequest(id);
    await fetchMyRequests();
  };

  const filterPills = ["All", "open", "fulfilled", "cancelled"];

  const filteredRequests = requests.filter((r) => {
    if (statusFilter === "All") return true;
    return r.status.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Blood Requests</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your posted emergency blood requests and check real-time donor fulfillment statuses.
          </p>
        </div>

        <Link
          href="/dashboard/request/new"
          className="self-start sm:self-auto bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl transition flex items-center gap-2 text-sm shadow-sm shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Request</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-8 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-2">Filter Status:</span>
        {filterPills.map((pill) => {
          const isActive = statusFilter === pill;
          return (
            <button
              key={pill}
              type="button"
              onClick={() => setStatusFilter(pill)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition ${
                isActive
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {pill}
            </button>
          );
        })}
      </div>

      {/* Request List */}
      <div>
        {isLoading && <LoadingSpinner message="Fetching your blood requests..." />}

        {error && (
          <div className="p-4 bg-red-50 rounded-2xl border border-red-200 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-red-700 font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchMyRequests}
              className="px-4 py-1.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 rounded-xl font-semibold transition"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && requests.length === 0 && (
          <EmptyState
            icon="📝"
            title="No requests yet"
            message="You haven't created any urgent blood requests yet. Click below when you need to alert emergency donors in your city."
            actionLabel="Post Your First Request"
            actionHref="/dashboard/request/new"
          />
        )}

        {!isLoading && !error && requests.length > 0 && filteredRequests.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500 shadow-sm animate-fadeIn">
            <p className="text-sm font-medium">
              No requests found matching status &quot;<span className="font-semibold text-gray-800 capitalize">{statusFilter}</span>&quot;.
            </p>
            <button
              onClick={() => setStatusFilter("All")}
              className="mt-4 text-xs text-red-600 font-semibold hover:underline"
            >
              Reset Status Filter
            </button>
          </div>
        )}

        {!isLoading && !error && filteredRequests.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {filteredRequests.map((req) => (
              <RequestCard
                key={req._id}
                id={req._id}
                patientName={req.patientName}
                bloodType={req.bloodType}
                units={req.units}
                hospital={req.hospital}
                city={req.city}
                urgency={req.urgency}
                status={req.status}
                contactPhone={req.contactPhone}
                createdAt={req.createdAt}
                isOwner={true}
                onCancel={handleCancelRequest}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
