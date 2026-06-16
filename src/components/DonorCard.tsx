import React, { useState, memo } from "react";
import { BloodType } from "@/lib/constants";
import { BloodTypeBadge } from "./BloodTypeBadge";
import { Phone, MapPin, ShieldCheck, Copy, Check } from "lucide-react";
import { formatWhatsAppUrl } from "@/lib/utils";

interface DonorCardProps {
  name: string;
  bloodType: BloodType;
  city: string;
  phone: string;
  isAvailable: boolean;
}

export const DonorCard = memo<DonorCardProps>(({
  name,
  bloodType,
  city,
  phone,
  isAvailable,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
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

      <div className="mt-6 space-y-2.5">
        <div className="flex items-center gap-2">
          {/* Main Dial Button */}
          <a
            href={`tel:${phone}`}
            className="flex-1 bg-white hover:bg-red-600 text-red-600 hover:text-white border-2 border-red-600 font-black py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-xs hover:shadow-md active:scale-[0.98] tracking-wide uppercase"
            title="Start Cellular Call"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call {phone}</span>
          </a>

          {/* WhatsApp Redirect Button */}
          <a
            href={formatWhatsAppUrl(phone, `Hi ${name}, I saw your donor profile on BloodMatch and would like to reach out regarding a blood requirement.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-3 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 text-xs hover:shadow-md active:scale-[0.98] font-bold"
            title="Chat on WhatsApp"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.56 0 11.9-5.335 11.903-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>

        {/* Copy / Number Showcase Button */}
        <button
          onClick={handleCopy}
          className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200/80 font-bold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-[11px] shadow-inner"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Number Copied!" : `Copy Number: ${phone}`}</span>
        </button>
      </div>
    </div>
  );
});

DonorCard.displayName = "DonorCard";
