import React, { useState } from "react";
import { BloodType, UrgencyLevel, RequestStatus } from "@/lib/constants";
import { BloodTypeBadge } from "./BloodTypeBadge";
import { UrgencyBadge } from "./UrgencyBadge";
import Link from "next/link";
import { Hospital, MapPin, Phone, Calendar, Droplets, Share2, Sparkles, XCircle } from "lucide-react";

interface RequestCardProps {
  id: string;
  patientName: string;
  bloodType: BloodType;
  units: number;
  hospital: string;
  city: string;
  urgency: UrgencyLevel;
  status: RequestStatus;
  contactPhone: string;
  createdAt: string;
  isOwner?: boolean;
  onCancel?: (id: string) => Promise<void>;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  } catch {
    return "recently";
  }
}

export const RequestCard: React.FC<RequestCardProps> = ({
  id,
  patientName,
  bloodType,
  units,
  hospital,
  city,
  urgency,
  status,
  contactPhone,
  createdAt,
  isOwner,
  onCancel,
}) => {
  const [cancelling, setCancelling] = useState(false);

  const statusColors: Record<string, string> = {
    open: "bg-green-500 text-white shadow-xs",
    fulfilled: "bg-blue-600 text-white shadow-xs",
    cancelled: "bg-gray-200 text-gray-700",
  };

  const handleCancelClick = async () => {
    if (!onCancel) return;
    if (confirm("Are you sure you want to cancel this blood request?")) {
      setCancelling(true);
      try {
        await onCancel(id);
      } finally {
        setCancelling(false);
      }
    }
  };

  return (
    <div className={`bg-white/95 backdrop-blur-xl rounded-3xl border border-gray-100 p-7 shadow-xs flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:border-red-100 relative overflow-hidden group ${
      status === "cancelled" ? "opacity-60" : ""
    }`}>
      {/* Subtle Side Ribbon */}
      <div className={`absolute top-0 right-0 w-1.5 h-full transition-colors ${
        urgency === "critical" ? "bg-gradient-to-b from-red-600 to-orange-500" : "bg-gradient-to-b from-red-400 to-red-600"
      }`} />

      <div>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-gray-400">ID: {id}</span>
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                statusColors[status] || "bg-gray-100 text-gray-600"
              }`}>
                {status}
              </span>
            </div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight group-hover:text-red-950 transition-colors">{patientName}</h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="scale-110">
              <BloodTypeBadge type={bloodType} />
            </div>
            <UrgencyBadge urgency={urgency} />
          </div>
        </div>

        {/* Structured Data Rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-4 border-t border-gray-100/80">
          <div className="bg-gray-50/80 rounded-2xl p-3.5 border border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center shrink-0">
              <Hospital className="w-4 h-4 text-red-600" />
            </div>
            <div className="overflow-hidden">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Medical Facility</span>
              <span className="text-xs font-black text-gray-900 truncate block">{hospital}</span>
            </div>
          </div>

          <div className="bg-gray-50/80 rounded-2xl p-3.5 border border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-red-600" />
            </div>
            <div className="overflow-hidden">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Location Center</span>
              <span className="text-xs font-black text-gray-900 truncate block">📍 {city} Area</span>
            </div>
          </div>
        </div>

        {/* Essential Quantity & Phone Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-red-500/10 via-rose-500/5 to-white rounded-2xl p-4 border border-red-100/80 mt-3">
          <div className="flex items-center gap-2.5">
            <Droplets className="w-5 h-5 text-red-600 animate-pulse" />
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-red-900 block">Units Required</span>
              <span className="text-sm font-black text-red-700">{units} Verified Unit{units > 1 ? "s" : ""}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <a href={`tel:${contactPhone}`} className="text-xs font-black text-blue-700 hover:underline tracking-tight">
              {contactPhone}
            </a>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-7 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span>Posted {formatRelativeTime(createdAt)}</span>
        </div>

        <div className="flex items-center gap-2">
          {status === "open" && (
            <Link
              href={`/share?id=${id}`}
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-inner"
              title="Share this urgent request"
            >
              <Share2 className="w-3.5 h-3.5 text-red-600" />
              <span>Share</span>
            </Link>
          )}

          {isOwner && status === "open" && (
            <button
              onClick={handleCancelClick}
              disabled={cancelling}
              className="px-3.5 py-2 border-2 border-gray-300 hover:bg-red-50 hover:text-red-700 hover:border-red-300 text-gray-600 rounded-xl text-xs font-black transition flex items-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>{cancelling ? "Cancelling..." : "Cancel Request"}</span>
            </button>
          )}

          {status === "open" && (
            <Link
              href={`/dashboard/match?bloodType=${encodeURIComponent(bloodType)}&city=${encodeURIComponent(city)}`}
              className="btn-primary py-2.5 px-5 text-xs font-black uppercase tracking-wider"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Find Donors →</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
