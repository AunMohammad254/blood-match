import React from "react";
import { BloodType } from "@/lib/constants";

interface BloodTypeBadgeProps {
  type: BloodType;
  showIcon?: boolean;
}

export const BloodTypeBadge: React.FC<BloodTypeBadgeProps> = ({ type, showIcon = true }) => {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-red-50 via-red-100/60 to-red-100 text-red-800 border border-red-200 shadow-sm tracking-wider">
      {showIcon && <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse shrink-0 shadow-sm shadow-red-500/50" />}
      <span>{type}</span>
    </span>
  );
};
