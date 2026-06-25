import React, { useState, memo } from "react";
import { BloodType, UrgencyLevel, RequestStatus } from "@/lib/constants";
import { BloodTypeBadge } from "./BloodTypeBadge";
import { UrgencyBadge } from "./UrgencyBadge";
import Link from "next/link";
import { Hospital, MapPin, Phone, Calendar, Droplets, Share2, Sparkles, XCircle, Copy, Check, AlertTriangle } from "lucide-react";
import { formatWhatsAppUrl, formatRelativeTime } from "@/lib/utils";

interface RequestCardProps {
  id: string;
  patientName: string;
  bloodType: BloodType;
  units: number;
  hospital: string;
  city: string;
  urgency: UrgencyLevel;
  status: RequestStatus;
  contactPhone?: string;
  createdAt: string;
  isOwner?: boolean;
  onCancel?: (id: string) => Promise<void>;
  currentUserRole?: string;
  matchedDonor?: {
    name: string;
    phone: string;
    city: string;
  };
  onAccept?: (id: string) => Promise<void>;
  onDecline?: (id: string) => Promise<void>;
  onReport?: (id: string) => Promise<void>;
}

export const RequestCard = memo<RequestCardProps>(({
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
  currentUserRole,
  matchedDonor,
  onAccept,
  onDecline,
  onReport,
}) => {
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [responding, setResponding] = useState(false);

  const handleCopy = () => {
    if (contactPhone) {
      navigator.clipboard.writeText(contactPhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAcceptClick = async () => {
    if (!onAccept) return;
    setResponding(true);
    try {
      await onAccept(id);
    } finally {
      setResponding(false);
    }
  };

  const handleDeclineClick = async () => {
    if (!onDecline) return;
    if (confirm("Are you sure you want to decline this request? It will be hidden from your feed.")) {
      setResponding(true);
      try {
        await onDecline(id);
      } finally {
        setResponding(false);
      }
    }
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

  const handleReportClick = async () => {
    if (!onReport) return;
    if (confirm("Are you sure you want to report this request as fake/suspicious?")) {
      await onReport(id);
    }
  };

  return (
    <div className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-gray-100 dark:border-slate-800 p-7 shadow-xs flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:border-red-100 dark:hover:border-red-950/20 relative overflow-hidden group ${
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
              <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-slate-500">ID: {id}</span>
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                statusColors[status] || "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400"
              }`}>
                {status}
              </span>
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight group-hover:text-red-950 dark:group-hover:text-red-400 transition-colors">{patientName}</h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="scale-110">
              <BloodTypeBadge type={bloodType} />
            </div>
            <UrgencyBadge urgency={urgency} />
          </div>
        </div>

        {/* Structured Data Rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-4 border-t border-gray-100/80 dark:border-slate-800">
          <div className="bg-gray-50/80 dark:bg-slate-800/40 rounded-2xl p-3.5 border border-gray-100 dark:border-slate-800 flex items-center gap-3 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 shadow-xs flex items-center justify-center shrink-0 transition-colors">
              <Hospital className="w-4 h-4 text-red-655 dark:text-red-500" />
            </div>
            <div className="overflow-hidden">
              <span className="text-[10px] font-extrabold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">Medical Facility</span>
              <span className="text-xs font-black text-gray-900 dark:text-white truncate block">{hospital}</span>
            </div>
          </div>

          <div className="bg-gray-50/80 dark:bg-slate-800/40 rounded-2xl p-3.5 border border-gray-100 dark:border-slate-800 flex items-center gap-3 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 shadow-xs flex items-center justify-center shrink-0 transition-colors">
              <MapPin className="w-4 h-4 text-red-655 dark:text-red-500" />
            </div>
            <div className="overflow-hidden">
              <span className="text-[10px] font-extrabold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">Location Center</span>
              <span className="text-xs font-black text-gray-900 dark:text-white truncate block">📍 {city} Area</span>
            </div>
          </div>
        </div>

        {/* Essential Quantity & Phone Strip / Privacy Gate */}
        {contactPhone ? (
          <div className="flex flex-col gap-3.5 bg-gradient-to-r from-red-500/10 via-rose-500/5 to-white dark:from-red-950/20 dark:via-rose-955/5 dark:to-slate-900 rounded-2xl p-4 border border-red-100/80 dark:border-red-950/30 mt-3 transition-colors">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Droplets className="w-5 h-5 text-red-650 animate-pulse" />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-red-900 dark:text-red-300 block">Units Required</span>
                  <span className="text-sm font-black text-red-700 dark:text-red-400">{units} Verified Unit{units > 1 ? "s" : ""}</span>
                </div>
              </div>
              
              <span className="text-[10px] font-mono font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Contact Family</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-red-100/30 dark:border-red-950/20">
              {/* Dial Button */}
              <a
                href={`tel:${contactPhone}`}
                className="flex-1 bg-white dark:bg-slate-900 hover:bg-red-600 dark:hover:bg-red-650 text-red-600 dark:text-red-400 hover:text-white dark:hover:text-white border border-red-200 dark:border-slate-800 hover:border-transparent dark:hover:border-transparent font-extrabold py-2 px-3 rounded-xl transition text-[11px] flex items-center justify-center gap-1.5 shadow-xs hover:shadow active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-500/50"
                title="Call Family"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call {contactPhone}</span>
              </a>

              {/* WhatsApp Button */}
              <a
                href={formatWhatsAppUrl(contactPhone, `Hi, I saw your blood request for ${patientName} on BloodMatch and would like to help.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 text-[11px] hover:shadow active:scale-[0.98] font-bold focus:outline-none focus:ring-2 focus:ring-[#25D366]/50"
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
                className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-750 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 text-[11px] shadow-xs active:scale-[0.98] font-bold focus:outline-none focus:ring-2 focus:ring-red-500/50"
                title="Copy Number"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5 bg-gray-50/50 dark:bg-slate-800/40 rounded-2xl p-4 border border-gray-200/50 dark:border-slate-800/50 mt-3 transition-colors text-center shadow-xs">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">🔒 Contact Details Protected</span>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 max-w-sm mt-0.5 leading-relaxed">
                Contact information will be revealed once you accept this request.
              </p>
            </div>

            {currentUserRole === "donor" && status === "open" && (
              <div className="flex gap-2.5 mt-2 border-t border-gray-200/50 dark:border-slate-700/50 pt-3">
                <button
                  type="button"
                  onClick={handleAcceptClick}
                  disabled={responding}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-3 rounded-xl transition text-[11px] flex items-center justify-center gap-1 shadow-sm active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-500/50"
                >
                  {responding ? "Processing..." : "Accept Request"}
                </button>
                <button
                  type="button"
                  onClick={handleDeclineClick}
                  disabled={responding}
                  className="flex-1 bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-350 border border-gray-250 dark:border-slate-750 font-bold py-2.5 px-3 rounded-xl transition text-[11px] flex items-center justify-center gap-1 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-500/50"
                >
                  Decline
                </button>
              </div>
            )}
          </div>
        )}

        {/* Committed Matched Donor details for request owners */}
        {isOwner && status === "accepted" && matchedDonor && (
          <div className="mt-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/30 rounded-2xl p-4 flex flex-col gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-450">Matched Donor Committed</span>
            </div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center text-xs font-bold text-gray-900 dark:text-white mt-1 gap-2">
              <span>{matchedDonor.name} (📍 {matchedDonor.city})</span>
              <a
                href={`tel:${matchedDonor.phone}`}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-2 rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1 self-start sm:self-auto shadow-sm active:scale-95 transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call {matchedDonor.phone}</span>
              </a>
            </div>
          </div>
        )}
        </div>

      {/* Action Footer */}
      <div className="mt-7 pt-4 border-t border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-slate-500">
          <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
          <span>Posted {formatRelativeTime(createdAt)}</span>
        </div>

        <div className="flex items-center gap-2">
          {status === "open" && (
            <Link
              href={`/share?id=${id}`}
              className="px-3.5 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-750 text-gray-800 dark:text-slate-200 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-inner focus:outline-none focus:ring-2 focus:ring-red-500/50"
              title="Share this urgent request"
            >
              <Share2 className="w-3.5 h-3.5 text-red-650" />
              <span>Share</span>
            </Link>
          )}

          {status === "open" && !isOwner && onReport && (
            <button
              onClick={handleReportClick}
              className="px-3.5 py-2 border-2 border-transparent hover:bg-orange-50 dark:hover:bg-orange-950/20 text-gray-500 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400 rounded-xl text-xs font-black transition flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              title="Report suspicious request"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Report</span>
            </button>
          )}

          {isOwner && status === "open" && (
            <button
              onClick={handleCancelClick}
              disabled={cancelling}
              className="px-3.5 py-2 border-2 border-gray-300 dark:border-slate-750 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800 text-gray-600 dark:text-slate-350 rounded-xl text-xs font-black transition flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-red-500/50"
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
});

RequestCard.displayName = "RequestCard";
