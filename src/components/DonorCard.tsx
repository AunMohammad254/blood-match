import React from "react";
import { BloodType } from "@/lib/constants";
import { BloodTypeBadge } from "./BloodTypeBadge";
import { Phone, MapPin, ShieldCheck } from "lucide-react";

interface DonorCardProps {
  name: string;
  bloodType: BloodType;
  city: string;
  phone: string;
  isAvailable: boolean;
}

export const DonorCard: React.FC<DonorCardProps> = ({
  name,
  bloodType,
  city,
  phone,
  isAvailable,
}) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`bg-white/95 backdrop-blur-xl rounded-3xl border border-gray-100 p-6 shadow-xs flex flex-col justify-between transition-all duration-300 relative overflow-hidden group ${
        !isAvailable ? "opacity-55" : "hover:shadow-xl hover:border-red-100 hover:-translate-y-1"
      }`}
    >
      {/* Subtle Crimson Corner Accent */}
      {isAvailable && (
        <div className="absolute -right-10 -top-10 w-28 h-28 bg-gradient-to-br from-red-500/10 to-transparent rounded-full blur-xl group-hover:scale-125 transition-transform pointer-events-none" />
      )}

      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-white font-black flex items-center justify-center text-base shadow-md shadow-red-500/30 shrink-0 group-hover:scale-105 transition-transform">
              {initials || "🩸"}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded-md">Verified</span>
              </div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight mt-0.5">{name}</h3>
              <div className="flex items-center gap-1 text-xs font-bold text-gray-500 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>📍 {city} Area</span>
              </div>
            </div>
          </div>
          <div className="scale-110 origin-top-right">
            <BloodTypeBadge type={bloodType} />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold">
          <span className="text-gray-500 uppercase tracking-wider text-[10px]">Active Triage Status</span>
          {isAvailable ? (
            <span className="inline-flex items-center gap-1.5 text-green-700 font-extrabold text-xs bg-green-50 border border-green-200/80 px-3 py-1 rounded-full shadow-inner">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Available Fulfiller</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-gray-500 font-bold text-xs bg-gray-100 px-3 py-1 rounded-full shadow-inner">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              <span>Currently Inactive</span>
            </span>
          )}
        </div>
      </div>

      <div className="mt-6">
        <a
          href={`tel:${phone}`}
          className="w-full bg-white hover:bg-red-600 text-red-600 hover:text-white border-2 border-red-600 font-black px-6 py-3.5 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2.5 text-xs shadow-xs hover:shadow-lg hover:shadow-red-500/30 active:scale-[0.98] tracking-wide uppercase"
        >
          <Phone className="w-4 h-4" />
          <span>Dispatch Phone Call · {phone}</span>
        </a>
      </div>
    </div>
  );
};
