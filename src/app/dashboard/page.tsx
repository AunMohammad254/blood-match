"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getUser, updateUser } from "@/lib/auth";
import { User, RecipientRequest } from "@/types";
import { getRequests, toggleAvailability, cancelRequest } from "@/lib/api";
import { BloodTypeBadge } from "@/components/BloodTypeBadge";
import { RequestCard } from "@/components/RequestCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { PlusCircle, Search, AlertCircle, RefreshCw, Sparkles, Activity, ShieldCheck, HeartHandshake, MapPin } from "lucide-react";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  // Donor state
  const [isAvailable, setIsAvailable] = useState(true);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Shared requests state
  const [requests, setRequests] = useState<RecipientRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const currentUser = getUser();
    if (currentUser) {
      setUser(currentUser);
      setIsAvailable(currentUser.isAvailable ?? true);
      fetchData(currentUser);
    }
  }, []);

  const fetchData = async (currentUser: User) => {
    setIsLoading(true);
    setError("");

    try {
      if (currentUser.role === "donor") {
        // Fetch open requests
        const res = await getRequests({ status: "open" });
        setRequests(res.data.requests || []);
      } else {
        // Fetch recipient's own requests
        const res = await getRequests({ mine: true });
        setRequests(res.data.requests || []);
      }
    } catch (err: any) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    if (!user) return;
    setUpdatingAvailability(true);
    setStatusMessage("");

    const nextState = !isAvailable;
    try {
      await toggleAvailability(nextState);
      setIsAvailable(nextState);
      updateUser({ isAvailable: nextState });

      setStatusMessage("Status updated successfully.");
      setTimeout(() => setStatusMessage(""), 3500);
    } catch (err: any) {
      alert("Failed to update availability status.");
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const handleCancelRequest = async (id: string) => {
    await cancelRequest(id);
    if (user) {
      await fetchData(user);
    }
  };

  if (!user) return null;

  return (
    <div className="animate-fadeIn pb-12">
      
      {/* Dynamic Hybrid Swiss Overview Banners */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-red-950 text-white px-6 py-12 border-b border-gray-800 shadow-2xl relative overflow-hidden">
        
        {/* Subtle Backdrop Glows */}
        <div className="absolute top-0 right-10 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="font-mono text-xs font-bold text-gray-400 uppercase tracking-widest">Active Triaging Session</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Command Dashboard
            </h2>

            <div className="flex flex-wrap items-center gap-2.5 mt-3 text-xs sm:text-sm font-bold">
              <span className="text-red-400 uppercase tracking-wider bg-red-500/10 px-3 py-1 rounded-xl border border-red-500/20">{user.role}</span>
              <span className="text-gray-600">·</span>
              <span className="text-gray-300">Logged in as: <strong className="text-white tracking-wide">{user.name}</strong></span>
              <span className="text-gray-600">·</span>
              <span className="text-gray-300 flex items-center gap-2">
                Group: <BloodTypeBadge type={user.bloodType} />
              </span>
              <span className="text-gray-600">·</span>
              <span className="text-gray-300 flex items-center gap-1">📍 {user.city} Center</span>
            </div>
          </div>

          <button
            onClick={() => fetchData(user)}
            disabled={isLoading}
            className="self-start md:self-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-lg active:scale-95 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-red-400" : ""}`} />
            <span>{isLoading ? "Calibrating Feeds..." : "Refresh Data"}</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-10 space-y-12">
        
        {/* DONOR ECOSYSTEM */}
        {user.role === "donor" && (
          <div className="space-y-12">
            
            {/* Availability Neomorphic Command Toggle */}
            <div className="bg-white/95 backdrop-blur-2xl rounded-3xl border-2 border-gray-100 shadow-xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden group">
              <div className="absolute -right-12 -bottom-12 w-40 h-40 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-colors pointer-events-none" />

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Your Triage Active Status</h3>
                  {statusMessage && (
                    <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full font-black animate-fadeIn flex items-center gap-1.5 shadow-inner">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{statusMessage}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1.5 max-w-xl leading-relaxed">
                  Keep this toggle activated to show up instantly when nearby hospitals execute compatibility triages. Flip off if you travel or medically cannot fulfill requests right now.
                </p>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-auto shrink-0 bg-gray-50 p-3 rounded-2xl border border-gray-200/80">
                <div className="flex flex-col text-right">
                  <span className={`text-sm font-black uppercase tracking-wider ${isAvailable ? "text-emerald-700" : "text-gray-400"}`}>
                    {isAvailable ? "Active Lifesaver" : "Currently Inactive"}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{isAvailable ? "Universal feed linked" : "Surveillance paused"}</span>
                </div>

                <button
                  type="button"
                  onClick={handleToggleAvailability}
                  disabled={updatingAvailability}
                  className={`w-16 h-9 flex items-center rounded-full p-1.5 transition-all duration-300 focus:outline-none shadow-inner ${
                    isAvailable ? "bg-gradient-to-r from-emerald-500 to-green-600 shadow-emerald-500/30" : "bg-gray-300"
                  }`}
                  aria-label="Toggle availability state"
                >
                  <div
                    className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
                      isAvailable ? "translate-x-7" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Tactical Open Requests Feed */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-200/80">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-8 bg-red-600 rounded-full animate-pulse" />
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Open Hospital Requests</h2>
                    <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider block mt-0.5">Showing emergency requests sorted by medical prioritization</span>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 bg-red-100/80 text-red-800 border border-red-200 font-extrabold text-xs px-3.5 py-1.5 rounded-2xl shadow-xs">
                  <Activity className="w-3.5 h-3.5 text-red-600 animate-spin" />
                  <span>Real-Time Broadcast</span>
                </span>
              </div>

              {isLoading && <LoadingSpinner message="Scanning recent local blood requirements..." />}

              {error && (
                <div className="p-5 bg-red-50 rounded-2xl border border-red-200 flex items-center justify-between text-xs font-black text-red-800 shadow-sm animate-fadeIn">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                  <button
                    onClick={() => fetchData(user)}
                    className="px-4 py-2 bg-white border border-red-300 text-red-700 hover:bg-red-100 rounded-xl transition"
                  >
                    Retry Scan
                  </button>
                </div>
              )}

              {!isLoading && !error && requests.length === 0 && (
                <EmptyState
                  icon="🟢"
                  title="No urgent requests right now"
                  message="There are currently no open emergency blood requests in the triaging log. We will instantly notify nearby lifesavers when a request is posted."
                  actionLabel="Tactical Triage Radar"
                  actionHref="/radar"
                />
              )}

              {!isLoading && !error && requests.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {requests.map((req) => (
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
                    />
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* RECIPIENT ECOSYSTEM */}
        {user.role === "recipient" && (
          <div className="space-y-12">
            
            {/* Quick Authoritative Action Suites */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Post Action */}
              <div className="glass-card bg-gradient-to-br from-white via-white to-red-50/30 p-8 sm:p-10 rounded-3xl flex flex-col justify-between group border-2 hover:border-red-200 shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center text-3xl shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform">
                      <span>🔴</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-700 bg-red-100 px-3 py-1 rounded-full">Urgent Priority</span>
                  </div>

                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Post Blood Request</h3>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium mt-2.5 leading-relaxed">
                    Instantly alert registered active blood donors across your city. The system automatically notifies matching lifesavers based on hematological compatibility.
                  </p>
                </div>

                <div className="mt-10">
                  <Link
                    href="/dashboard/request/new"
                    className="w-full btn-primary py-4 tracking-widest uppercase text-xs"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create Emergency Request</span>
                  </Link>
                </div>
              </div>

              {/* Match Scan Action */}
              <div className="glass-card bg-gradient-to-br from-white via-white to-blue-50/20 p-8 sm:p-10 rounded-3xl flex flex-col justify-between group border-2 hover:border-blue-200 shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gray-900 text-white flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform">
                      <span>🔍</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 bg-blue-100 px-3 py-1 rounded-full">Universal Scan</span>
                  </div>

                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Scan Active Donors</h3>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium mt-2.5 leading-relaxed">
                    Launch a fully customized query across our donor grid to filter active, verified available fulfillers in your area and dial them directly.
                  </p>
                </div>

                <div className="mt-10">
                  <Link
                    href="/dashboard/match"
                    className="w-full btn-secondary py-4 tracking-widest uppercase text-xs"
                  >
                    <Search className="w-4 h-4" />
                    <span>Launch Matching Query</span>
                  </Link>
                </div>
              </div>

            </div>

            {/* Recipient Recent Posted Log */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-200/80">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-8 bg-blue-600 rounded-full" />
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Your Recent Requests</h2>
                    <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider block mt-0.5">Showing your recently authorized emergency broadcast posts</span>
                  </div>
                </div>

                <Link
                  href="/dashboard/my-requests"
                  className="btn-secondary py-2 px-4 text-xs font-black uppercase tracking-wider shadow-xs"
                >
                  <span>Manage All Log Posts →</span>
                </Link>
              </div>

              {isLoading && <LoadingSpinner message="Retrieving your posted requests log..." />}

              {error && (
                <div className="p-5 bg-red-50 rounded-2xl border border-red-200 flex items-center justify-between text-xs font-black text-red-800 shadow-sm animate-fadeIn">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                  <button
                    onClick={() => fetchData(user)}
                    className="px-4 py-2 bg-white border border-red-300 text-red-700 hover:bg-red-100 rounded-xl transition"
                  >
                    Retry Scan
                  </button>
                </div>
              )}

              {!isLoading && !error && requests.length === 0 && (
                <EmptyState
                  icon="📝"
                  title="No emergency requirements logged yet"
                  message="You haven't posted any urgent blood requests yet. When a medical emergency occurs, launch an instant requirement to alert your city."
                  actionLabel="Create emergency request"
                  actionHref="/dashboard/request/new"
                />
              )}

              {!isLoading && !error && requests.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {requests.slice(0, 4).map((req) => (
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
        )}

      </div>
    </div>
  );
}
