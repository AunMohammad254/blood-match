import React from "react";
import { UrgencyLevel } from "@/lib/constants";
import { AlertCircle, ShieldAlert, Sparkles } from "lucide-react";

interface UrgencyBadgeProps {
  urgency: UrgencyLevel;
}

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ urgency }) => {
  if (urgency === "critical") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-red-600 via-red-500 to-orange-600 text-white shadow-md shadow-red-500/30 animate-pulse uppercase tracking-wider">
        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
        <span>Critical</span>
      </span>
    );
  }

  if (urgency === "urgent") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-yellow-50 via-amber-100/60 to-amber-100 text-amber-900 border border-amber-300 shadow-sm uppercase tracking-wider">
        <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
        <span>Urgent</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-emerald-50 to-green-100/80 text-emerald-900 border border-emerald-200 shadow-sm uppercase tracking-wider">
      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      <span>Normal</span>
    </span>
  );
};
