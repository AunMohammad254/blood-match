import React, { useState, useEffect } from "react";
import { BLOOD_TYPES, CITIES } from "@/lib/constants";
import { Search, Filter, Hospital, Sparkles } from "lucide-react";

interface MatchSearchFormProps {
  defaultBloodType?: string;
  defaultCity?: string;
  onSearch: (bloodType: string, city: string, lat?: number, lng?: number, maxDistance?: number) => void;
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
    onSearch(bloodType, city, location?.lat, location?.lng, maxDistance);
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
          <select
            id="searchBloodType"
            value={bloodType}
            onChange={(e) => setBloodType(e.target.value)}
            required
            className="w-full bg-gray-50/90 dark:bg-slate-800 border-2 border-gray-200/80 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm font-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:bg-white dark:focus:bg-slate-900 shadow-inner transition"
          >
            {BLOOD_TYPES.map((bt) => (
              <option key={bt} value={bt} className="dark:bg-slate-950">
                {bt} Universal Group Fulfiller
              </option>
            ))}
          </select>
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
            <select
              id="searchCity"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                if (e.target.value) setLocation(null);
              }}
              className="w-full bg-gray-50/90 dark:bg-slate-800 border-2 border-gray-200/80 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:bg-white dark:focus:bg-slate-900 shadow-inner transition"
            >
              <option value="" className="dark:bg-slate-950">🌐 All Pakistan Cities</option>
              {CITIES.map((c) => (
                <option key={c} value={c} className="dark:bg-slate-950">
                  {c} Triage Hub
                </option>
              ))}
            </select>
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
              <select
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-full bg-gray-50/90 dark:bg-slate-800 border-2 border-gray-200/80 dark:border-slate-700 rounded-2xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <option value={5000}>Within 5 km</option>
                <option value={10000}>Within 10 km</option>
                <option value={25000}>Within 25 km</option>
                <option value={50000}>Within 50 km</option>
              </select>
            </div>
          </div>
        )}

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
