import React, { useState } from "react";
import { BloodType, UrgencyLevel, RequestStatus } from "@/lib/constants";
import { BloodTypeBadge } from "./BloodTypeBadge";
import { UrgencyBadge } from "./UrgencyBadge";
import Link from "next/link";
import { Hospital, MapPin, Phone, Calendar, Droplets, Share2, Sparkles, XCircle, Copy, Check } from "lucide-react";

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
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(contactPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        <div className="flex flex-col gap-3.5 bg-gradient-to-r from-red-500/10 via-rose-500/5 to-white rounded-2xl p-4 border border-red-100/80 mt-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Droplets className="w-5 h-5 text-red-600 animate-pulse" />
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-red-900 block">Units Required</span>
                <span className="text-sm font-black text-red-700">{units} Verified Unit{units > 1 ? "s" : ""}</span>
              </div>
            </div>
            
            <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Contact Family</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-red-100/30">
            {/* Dial Button */}
            <a
              href={`tel:${contactPhone}`}
              className="flex-1 bg-white hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-transparent font-extrabold py-2 px-3 rounded-xl transition text-[11px] flex items-center justify-center gap-1.5 shadow-xs hover:shadow active:scale-[0.98]"
              title="Call Family"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call {contactPhone}</span>
            </a>

            {/* WhatsApp Button */}
            <a
              href={`https://wa.me/${contactPhone.startsWith("0") ? `92${contactPhone.slice(1)}` : contactPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 text-[11px] hover:shadow active:scale-[0.98] font-bold"
              title="WhatsApp Message"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.56 0 11.9-5.335 11.903-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>WhatsApp</span>
            </a>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 text-[11px] shadow-xs active:scale-[0.98] font-bold"
              title="Copy Number"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
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
