import React, { useState, useEffect, useMemo } from "react";
import { BLOOD_TYPES, CITIES } from "@/lib/constants";
import { Search, Filter, Hospital, Sparkles } from "lucide-react";
import { PremiumSelect, Option } from "./ui/PremiumSelect";

interface MatchSearchFormProps {
  defaultBloodType?: string;
  defaultCity?: string;
  onSearch: (bloodType: string, city: string, lat?: number, lng?: number, maxDistance?: number, includeUnavailable?: boolean, ignoreCooldown?: boolean) => void;
  isLoading: boolean;
}

export const MatchSearchForm: React.FC<MatchSearchFormProps> = ({
  defaultBloodType = "A+",
  defaultCity = "",
  onSearch,
  isLoading,
}) => {
  const [bloodType, setBloodType] = useState(defaultBloodType);
  const [city, setCity] = useState(defaultCity);
  const [maxDistance, setMaxDistance] = useState(10000);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [includeUnavailable, setIncludeUnavailable] = useState(false);
  const [ignoreCooldown, setIgnoreCooldown] = useState(false);

  useEffect(() => {
    if (defaultBloodType) setBloodType(defaultBloodType);
    if (defaultCity) setCity(defaultCity);
  }, [defaultBloodType, defaultCity]);

  const handleLocate = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setCity(""); // Clear city if using exact location
          setIsLocating(false);
        },
        () => setIsLocating(false)
      );
    } else {
      setIsLocating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(bloodType, city, location?.lat, location?.lng, maxDistance, includeUnavailable, ignoreCooldown);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border-2 border-gray-100/90 dark:border-slate-800 p-8 shadow-xl relative overflow-hidden group transition-all duration-300">
      {/* Subtle Glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-red-500/10 to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end relative z-10">
        <div className="md:col-span-5">
          <label
            htmlFor="searchBloodType"
            className="block text-xs font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-red-650" />
            <span>Blood Type Needed <span className="text-red-500">*</span></span>
          </label>
          <PremiumSelect
            value={bloodType}
            onChange={(val) => setBloodType(val)}
            options={BLOOD_TYPES.map(bt => ({ value: bt, label: `${bt} Universal Group Fulfiller` }))}
            placeholder="Select Blood Type"
          />
        </div>

        <div className="md:col-span-4">
          <label
            htmlFor="searchCity"
            className="block text-xs font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"
          >
            <Hospital className="w-3.5 h-3.5 text-red-655" />
            <span>City Center (Optional)</span>
          </label>
          <div className="flex gap-2">
            <PremiumSelect
              value={city}
              onChange={(val) => {
                setCity(val);
                if (val) setLocation(null);
              }}
              options={[
                { value: "", label: "🌐 All Pakistan Cities" },
                ...CITIES.map((c) => ({ value: c, label: `${c} Triage Hub` }))
              ]}
              placeholder="🌐 All Pakistan Cities"
            />
            <button
              type="button"
              onClick={handleLocate}
              title="Use Exact Location"
              className={`px-3 py-3.5 rounded-2xl border-2 transition flex items-center justify-center ${location ? 'bg-red-50 border-red-200 text-red-650 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400' : 'bg-gray-50/90 border-gray-200/80 text-gray-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 hover:bg-gray-100'}`}
            >
              <Filter className={`w-5 h-5 ${isLocating ? 'animate-pulse' : ''}`} />
            </button>
          </div>
        </div>

        {location && (
          <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="bg-red-50 dark:bg-red-950/20 px-4 py-3 rounded-2xl border border-red-200 dark:border-red-900/30 text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Location Filter Active. Searching nearest donors.
            </div>
            <div>
              <label className="block text-xs font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Search Radius
              </label>
              <PremiumSelect
                value={String(maxDistance)}
                onChange={(val) => setMaxDistance(Number(val))}
                options={[
                  { value: "5000", label: "Within 5 km" },
                  { value: "10000", label: "Within 10 km" },
                  { value: "25000", label: "Within 25 km" },
                  { value: "50000", label: "Within 50 km" },
                ]}
              />
            </div>
          </div>
        )}

        <div className="md:col-span-12 flex flex-col sm:flex-row sm:items-center gap-4 mt-2">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={includeUnavailable}
              onChange={(e) => setIncludeUnavailable(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            Include Unavailable Donors
          </label>
          <label className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={ignoreCooldown}
              onChange={(e) => setIgnoreCooldown(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            Ignore 56-Day Cooldown (Emergencies)
          </label>
        </div>

        <div className="md:col-span-12 mt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3.5 text-xs font-black tracking-wider uppercase shadow-xl shadow-red-500/30"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-red-200 border-t-white rounded-full animate-spin" />
                <span>Scanning Engine...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search Donors</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
