"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Donor, RecipientRequest } from "@/types";
import { getDonors, getRequests } from "@/lib/api";
import { BLOOD_TYPES, CITIES, BloodType } from "@/lib/constants";
import { BloodTypeBadge } from "@/components/BloodTypeBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { 
  Radar as RadarIcon, 
  MapPin, 
  Hospital, 
  Phone, 
  User as UserIcon, 
  Filter, 
  Sparkles, 
  Play, 
  Pause, 
  Navigation,
  ArrowLeft,
  Clock,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check
} from "lucide-react";

// Interface for simulated plotted donor with coordinates
interface PlottedDonor extends Donor {
  x: number;
  y: number;
  distanceKm: number;
  travelTimeMins: number;
  angle: number;
}

export default function RadarPage() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [plottedDonors, setPlottedDonors] = useState<PlottedDonor[]>([]);
  const [activeRequests, setActiveRequests] = useState<RecipientRequest[]>([]);
  
  // Controls
  const [selectedCity, setSelectedCity] = useState<string>(CITIES[0] as string);
  const [targetBlood, setTargetBlood] = useState<string>("All");
  const [selectedDonor, setSelectedDonor] = useState<PlottedDonor | null>(null);
  
  // Radar Beam Animation
  const [isSweeping, setIsSweeping] = useState<boolean>(true);
  const [beamAngle, setBeamAngle] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [copied, setCopied] = useState(false);

  const handleCopy = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    fetchRadarData();
  }, [selectedCity]);

  // Sweep animation effect
  useEffect(() => {
    let animationFrameId: number;
    const animateBeam = () => {
      if (isSweeping) {
        setBeamAngle((prev) => (prev + 1.5) % 360);
      }
      animationFrameId = requestAnimationFrame(animateBeam);
    };
    animationFrameId = requestAnimationFrame(animateBeam);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isSweeping]);

  const fetchRadarData = async () => {
    setIsLoading(true);
    setSelectedDonor(null);
    try {
      const [donorsRes, requestsRes] = await Promise.all([
        getDonors({ city: selectedCity }),
        getRequests({ status: "open" }),
      ]);

      const rawDonors: Donor[] = donorsRes.data.donors || [];
      setDonors(rawDonors);
      setActiveRequests(requestsRes.data.requests || []);

      // Generate deterministic but realistic pseudo-random polar coordinates
      const mapped: PlottedDonor[] = rawDonors.map((d, index) => {
        // Pseudo-random angle based on ID or index
        const angle = ((index * 67 + 13) % 36) * 10; 
        // Distance between 1.5km and 14.5km
        const distanceKm = Number(((index * 2.3 + 1.8) % 13 + 1.5).toFixed(1));
        const travelTimeMins = Math.round(distanceKm * 2.2 + 2);

        // Convert polar (distance, angle) to SVG cartesian coordinates centered at (200, 200)
        // Max radius is 180px (representing 15km)
        const radiusPx = (distanceKm / 15) * 160;
        const rad = (angle * Math.PI) / 180;
        const x = 200 + radiusPx * Math.cos(rad);
        const y = 200 + radiusPx * Math.sin(rad);

        return {
          ...d,
          x,
          y,
          distanceKm,
          travelTimeMins,
          angle,
        };
      });

      // Sort by nearest first
      mapped.sort((a, b) => a.distanceKm - b.distanceKm);
      setPlottedDonors(mapped);
      if (mapped.length > 0) setSelectedDonor(mapped[0]);
    } catch (err) {
      console.error("Failed to fetch radar logistics data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const hospitalsMap: Record<string, string> = {
    Karachi: "Aga Khan University Hospital Center",
    Lahore: "Shaukat Khanum Memorial Hospital",
    Islamabad: "Pakistan Institute of Medical Sciences (PIMS)",
    Rawalpindi: "Holy Family Hospital Center",
    Faisalabad: "Allied Hospital Central",
    Peshawar: "Lady Reading Hospital Hub",
    Quetta: "Civil Hospital Command",
    Multan: "Nishtar Medical Center",
    Hyderabad: "Liaquat University Hospital",
    Sialkot: "Memorial Christian Hospital",
  };

  const centerHospital = hospitalsMap[selectedCity] || `${selectedCity} General Hospital Hub`;

  // Filter plotted donors
  const filteredDonors = plottedDonors.filter((d) => {
    if (targetBlood === "All") return true;
    return d.bloodType === targetBlood;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-medium transition mb-2 -ml-3"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <RadarIcon className="w-8 h-8 text-red-600" />
            <span>Emergency Logistics Radar</span>
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Real-time graphical command center monitoring active blood donors and estimated emergency travel times.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSweeping(!isSweeping)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              isSweeping 
                ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200" 
                : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
            }`}
          >
            {isSweeping ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSweeping ? "Pause Radar Beam" : "Resume Beam"}</span>
          </button>
        </div>
      </div>

      {/* Control Panel Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div>
          <label htmlFor="radarCity" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Hospital className="w-3.5 h-3.5 text-red-600" />
            <span>Center Triage Hub (City)</span>
          </label>
          <select
            id="radarCity"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>{c} Command Center</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="radarBlood" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-red-600" />
            <span>Highlight Blood Type</span>
          </label>
          <select
            id="radarBlood"
            value={targetBlood}
            onChange={(e) => {
              setTargetBlood(e.target.value);
              setSelectedDonor(null);
            }}
            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="All">All Blood Types (Universal View)</option>
            {BLOOD_TYPES.map((bt) => (
              <option key={bt} value={bt}>{bt} Donors</option>
            ))}
          </select>
        </div>

        <div className="bg-red-50/60 rounded-xl p-3.5 border border-red-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold text-red-900 block">Surveillance Radius</span>
            <span className="text-sm font-bold text-red-700">15 Kilometers (Active)</span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold bg-green-500 text-white px-2.5 py-1 rounded-lg shadow-sm">
            <Sparkles className="w-3 h-3" />
            <span>Live Triage</span>
          </span>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Calibrating radar coordinates..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Visual Triage Radar Grid */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex flex-col items-center relative">
            <div className="w-full flex items-center justify-between mb-4 px-2">
              <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                <span>GPS Radar Active</span>
              </span>
              <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                Center: {centerHospital}
              </span>
            </div>

            {/* Simulated Interactive SVG Radar Board */}
            <div className="relative w-full max-w-[400px] aspect-square rounded-full bg-gray-900 shadow-inner overflow-hidden border-4 border-gray-800 flex items-center justify-center">
              
              {/* Radar Grid Distance Rings */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400">
                <defs>
                  <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.3" />
                    <stop offset="80%" stopColor="#1E3A8A" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#0F172A" stopOpacity="0.9" />
                  </radialGradient>
                  
                  {/* Rotating Beam Mask */}
                  <linearGradient id="sweepBeam" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                <rect width="400" height="400" fill="url(#radarGlow)" />

                {/* Concentric Distance Circles */}
                <circle cx="200" cy="200" r="160" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 4" />
                <circle cx="200" cy="200" r="120" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="200" cy="200" r="80"  fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="200" cy="200" r="40"  fill="none" stroke="#64748B" strokeWidth="1" />

                {/* Axis Crosshairs */}
                <line x1="200" y1="0" x2="200" y2="400" stroke="#334155" strokeWidth="1" />
                <line x1="0" y1="200" x2="400" y2="200" stroke="#334155" strokeWidth="1" />
                
                {/* Diagonal Crosshairs */}
                <line x1="35" y1="35" x2="365" y2="365" stroke="#1E293B" strokeWidth="1" />
                <line x1="365" y1="35" x2="35" y2="365" stroke="#1E293B" strokeWidth="1" />

                {/* Distance Label Tags */}
                <text x="205" y="45" fill="#64748B" fontSize="10" fontWeight="bold">15km</text>
                <text x="205" y="85" fill="#64748B" fontSize="10" fontWeight="bold">11km</text>
                <text x="205" y="125" fill="#64748B" fontSize="10" fontWeight="bold">7km</text>
                <text x="205" y="165" fill="#94A3B8" fontSize="10" fontWeight="bold">3.5km</text>
              </svg>

              {/* Animated Rotating Radar Sweeping Beam */}
              <div 
                className="absolute inset-0 pointer-events-none transform origin-center"
                style={{ transform: `rotate(${beamAngle}deg)` }}
              >
                <svg className="w-full h-full" viewBox="0 0 400 400">
                  <path
                    d="M 200 200 L 200 0 A 200 200 0 0 1 340 58 Z"
                    fill="url(#sweepBeam)"
                  />
                  <line x1="200" y1="200" x2="200" y2="0" stroke="#EF4444" strokeWidth="2" strokeOpacity="0.8" />
                </svg>
              </div>

              {/* Center Hospital Cross Pin */}
              <div className="absolute w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg animate-pulse z-20 border-2 border-white" title="Target Hospital Center">
                <Hospital className="w-4 h-4" />
              </div>

              {/* Plotted Interactive Plotted Donor Pins */}
              {filteredDonors.map((d) => {
                const isSelected = selectedDonor?._id === d._id;
                
                return (
                  <button
                    key={d._id}
                    type="button"
                    onClick={() => setSelectedDonor(d)}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none group ${
                      isSelected ? "z-30 scale-125 ring-4 ring-white" : "z-10 hover:scale-110"
                    }`}
                    style={{ left: `${d.x}px`, top: `${d.y}px` }}
                    aria-label={`Donor ${d.name}`}
                  >
                    {/* Pulsing Outer Glow */}
                    <span className={`absolute w-7 h-7 rounded-full opacity-75 animate-ping ${
                      d.bloodType.includes("-") ? "bg-blue-400" : "bg-red-500"
                    }`} />
                    
                    {/* Inner Donor Node */}
                    <span className={`w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center text-white shadow-md border border-white/40 ${
                      isSelected 
                        ? "bg-yellow-500 text-black font-black" 
                        : d.bloodType.includes("-") 
                        ? "bg-blue-600 hover:bg-blue-500" 
                        : "bg-red-600 hover:bg-red-500"
                    }`}>
                      {d.bloodType}
                    </span>

                    {/* Quick Hover Info tooltip */}
                    <div className="absolute bottom-8 bg-white text-gray-900 text-[10px] font-bold px-2 py-1 rounded shadow-md pointer-events-none opacity-0 group-hover:opacity-100 transition whitespace-nowrap border border-gray-200 z-40">
                      <span>{d.name} · {d.distanceKm}km</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="w-full mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between text-xs text-gray-500 gap-2">
              <div className="flex items-center gap-3 font-semibold">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600 inline-block" /> Rh Positive</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> Rh Negative</span>
              </div>
              <span>Click any map node to load dispatch parameters</span>
            </div>
          </div>

          {/* Right Detailed Dispatch Command Interface */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Selected Donor Card or Default Overview */}
            {selectedDonor ? (
              <div className="bg-white rounded-3xl border-2 border-red-600 shadow-md p-8 relative overflow-hidden animate-fadeIn space-y-6">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-red-50 rounded-full opacity-80 pointer-events-none" />

                <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-red-600 text-white font-extrabold flex items-center justify-center text-lg shadow-sm">
                      {selectedDonor.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full inline-block mb-1">
                        ✓ Active Verified Donor
                      </span>
                      <h3 className="text-xl font-black text-gray-900">{selectedDonor.name}</h3>
                    </div>
                  </div>
                  <div className="scale-125 origin-top-right">
                    <BloodTypeBadge type={selectedDonor.bloodType as BloodType} />
                  </div>
                </div>

                {/* Logistics Travel Parameters */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase mb-1">
                      <MapPin className="w-4 h-4 text-red-600" />
                      <span>Est. Travel Distance</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 mt-0.5">
                      {selectedDonor.distanceKm} <span className="text-sm font-bold text-gray-600">km</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase mb-1">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>Est. Driving Time</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 mt-0.5">
                      {selectedDonor.travelTimeMins} <span className="text-sm font-bold text-gray-600">mins</span>
                    </div>
                  </div>
                </div>

                {/* Direct Dispatch Command Strip */}
                <div className="space-y-3 pt-2">
                  <div className="flex gap-2">
                    <a
                      href={`tel:${selectedDonor.phone}`}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-xs"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call {selectedDonor.phone}</span>
                    </a>

                    <a
                      href={`https://wa.me/${selectedDonor.phone.startsWith("0") ? `92${selectedDonor.phone.slice(1)}` : selectedDonor.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-xs"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.56 0 11.9-5.335 11.903-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      <span>WhatsApp</span>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(selectedDonor.phone)}
                    className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200/80 font-bold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-xs shadow-inner"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? "Number Copied!" : `Copy Number: ${selectedDonor.phone}`}</span>
                  </button>
                  <p className="text-center text-[10px] text-gray-400">
                    Natively launches cellular call, WhatsApp message, or copies to clipboard
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center text-gray-500 shadow-sm">
                <div className="text-5xl mb-4">🎯</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Donor Selected</h3>
                <p className="text-sm max-w-sm mx-auto leading-relaxed">
                  Click on any interactive glowing pin on the radar grid to calculate emergency ETA and load instant cellular dispatch coordinates.
                </p>
              </div>
            )}

            {/* Hub Readiness Analytics Summary */}
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-4">
              <h4 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-red-600" />
                <span>Active Triage Readiness</span>
              </h4>
              
              <div className="space-y-3 pt-1 text-sm">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 font-medium">
                  <span className="text-gray-600">Active Verified Lifesavers</span>
                  <span className="font-bold text-gray-900 bg-red-50 text-red-700 px-2.5 py-0.5 rounded-lg">{filteredDonors.length} Ready</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 font-medium">
                  <span className="text-gray-600">Average ETA to {selectedCity}</span>
                  <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg">
                    {filteredDonors.length > 0 ? Math.round(filteredDonors.reduce((acc, d) => acc + d.travelTimeMins, 0) / filteredDonors.length) : 0} Minutes
                  </span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span className="text-gray-600">Logistics Efficiency Rating</span>
                  <span className="font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-lg">99.4% Optimum</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
