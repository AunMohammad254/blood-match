import React, { useState, useEffect } from "react";
import { BLOOD_TYPES, CITIES } from "@/lib/constants";
import { Search, Filter, Hospital, Sparkles } from "lucide-react";

interface MatchSearchFormProps {
  defaultBloodType?: string;
  defaultCity?: string;
  onSearch: (bloodType: string, city: string) => void;
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

  useEffect(() => {
    if (defaultBloodType) setBloodType(defaultBloodType);
    if (defaultCity) setCity(defaultCity);
  }, [defaultBloodType, defaultCity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(bloodType, city);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-2xl rounded-3xl border-2 border-gray-100/90 p-8 shadow-xl relative overflow-hidden group">
      {/* Subtle Glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-red-500/10 to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end relative z-10">
        <div className="md:col-span-5">
          <label
            htmlFor="searchBloodType"
            className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-red-600" />
            <span>Blood Type Needed <span className="text-red-600">*</span></span>
          </label>
          <select
            id="searchBloodType"
            value={bloodType}
            onChange={(e) => setBloodType(e.target.value)}
            required
            className="w-full bg-gray-50/90 border-2 border-gray-200/80 rounded-2xl px-4 py-3.5 text-sm font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white shadow-inner transition"
          >
            {BLOOD_TYPES.map((bt) => (
              <option key={bt} value={bt}>
                {bt} Universal Group Fulfiller
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-4">
          <label
            htmlFor="searchCity"
            className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"
          >
            <Hospital className="w-3.5 h-3.5 text-red-600" />
            <span>City Center (Optional)</span>
          </label>
          <select
            id="searchCity"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full bg-gray-50/90 border-2 border-gray-200/80 rounded-2xl px-4 py-3.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white shadow-inner transition"
          >
            <option value="">🌐 All Pakistan Cities</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c} Triage Hub
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
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
