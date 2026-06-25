"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { RecipientRequest } from "@/types";
import { getRequests } from "@/lib/api";
import { BloodTypeBadge } from "@/components/BloodTypeBadge";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { 
  Share2, 
  Copy, 
  Check, 
  MessageCircle, 
  Twitter, 
  Smartphone, 
  ArrowLeft, 
  Hospital, 
  MapPin, 
  Phone, 
  Droplets,
  AlertTriangle
} from "lucide-react";
import { PremiumSelect } from "@/components/ui/PremiumSelect";

function ShareSuite() {
  const searchParams = useSearchParams();
  const targetId = searchParams.get("id");

  const [requests, setRequests] = useState<RecipientRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RecipientRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    fetchOpenRequests();
  }, [targetId]);

  const fetchOpenRequests = async () => {
    setIsLoading(true);
    try {
      const res = await getRequests({ status: "open" });
      const data = res.data.requests || [];
      setRequests(data);

      if (targetId) {
        const found = data.find((r: RecipientRequest) => r._id === targetId);
        if (found) setSelectedRequest(found);
      } else if (data.length > 0) {
        setSelectedRequest(data[0]);
      }
    } catch (err) {
      console.error("Failed to load requests for sharing", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading graphic sharing suite..." />;
  }

  if (!selectedRequest && requests.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm mt-8 transition-colors duration-300">
        <div className="text-5xl mb-4">🩸</div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No urgent requests to share</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
          There are currently no open emergency blood requests. You can post a new request from the dashboard.
        </p>
        <Link
          href="/dashboard/request/new"
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-xl transition shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
        >
          Post a Blood Request
        </Link>
      </div>
    );
  }

  const req = selectedRequest || requests[0];
  if (!req) return null;

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/share?id=${req._id}` : `https://bloodmatch.app/share?id=${req._id}`;

  const whatsappText = `🚨 *URGENT BLOOD NEEDED* 🚨\n\n*Patient:* ${req.patientName}\n*Blood Type:* ${req.bloodType} (${req.units} Unit${req.units > 1 ? "s" : ""} needed)\n*Hospital:* ${req.hospital}, ${req.city}\n*Urgency:* ${req.urgency.toUpperCase()} ${req.urgency === "critical" ? "🔴" : "🟡"}\n\n*📞 Contact Family:* ${req.contactPhone}\n\n🌐 *Find matching donors instantly or verify details:* \n${shareUrl}`;

  const twitterText = `🚨 URGENT BLOOD NEEDED: ${req.bloodType} for ${req.patientName} at ${req.hospital}, ${req.city}. ${req.units} unit(s) needed. Please call ${req.contactPhone} or retweet! #BloodDonation #SaveALife #UrgentBlood`;

  const handleCopyWhatsapp = () => {
    navigator.clipboard.writeText(whatsappText);
    setCopiedWhatsapp(true);
    setTimeout(() => setCopiedWhatsapp(false), 3000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Urgent Blood Request: ${req.bloodType}`,
          text: `Urgent blood required (${req.bloodType}) for ${req.patientName} at ${req.hospital}, ${req.city}.`,
          url: shareUrl,
        });
      } catch (err) {
        console.log("Native share cancelled or failed", err);
      }
    } else {
      alert("Mobile system share is not supported on this device/browser. Please copy the link or WhatsApp text!");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg text-sm font-medium transition mb-2 -ml-3 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Share2 className="w-7 h-7 text-red-600" />
            <span>Share Emergency Request</span>
          </h1>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
            Amplify this urgent medical request across local community networks and social channels.
          </p>
        </div>

        {requests.length > 1 && (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-1.5 shadow-sm flex items-center gap-2 transition-colors duration-300">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 pl-2">Select Request:</span>
            <div className="w-64">
              <PremiumSelect
                value={req._id!}
                onChange={(val) => {
                  const f = requests.find((r) => r._id === val);
                  if (f) setSelectedRequest(f);
                }}
                options={requests.map((item) => ({
                  value: item._id!,
                  label: `${item.patientName} (${item.bloodType}) · ${item.city}`
                }))}
                placeholder="Select Request"
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: The Aesthetic Preview Card */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-8 shadow-sm relative overflow-hidden group transition-all duration-300">
          {/* Subtle Graphic Accents */}
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-red-50 dark:bg-red-950/10 rounded-full blur-2xl opacity-60 pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-yellow-50 dark:bg-yellow-950/10 rounded-full blur-2xl opacity-60 pointer-events-none" />

          {/* Emergency Graphic Banner */}
          <div className="bg-red-600 text-white rounded-2xl p-6 shadow-sm flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-yellow-300 animate-pulse shrink-0" />
              <div>
                <span className="text-xs font-extrabold tracking-wider uppercase text-red-100 block">Emergency Triage Alert</span>
                <h2 className="text-2xl font-black tracking-tight leading-none mt-0.5">BLOOD NEEDED</h2>
              </div>
            </div>
            <div className="bg-white/15 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-center">
              <span className="text-xs font-semibold text-red-100 block">Units Required</span>
              <span className="text-2xl font-black text-white">{req.units} UNIT{req.units > 1 ? "S" : ""}</span>
            </div>
          </div>

          {/* Patient Details Suite */}
          <div className="space-y-6 relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Patient Name</span>
                <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{req.patientName}</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="scale-125 transform origin-right">
                  <BloodTypeBadge type={req.bloodType} />
                </div>
                <UrgencyBadge urgency={req.urgency} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="bg-gray-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-gray-100/80 dark:border-slate-800 transition-colors">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1">
                  <Hospital className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                  <span>Hospital / Medical Facility</span>
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white mt-1">{req.hospital}</p>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-gray-100/80 dark:border-slate-800 transition-colors">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1">
                  <MapPin className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                  <span>City Location</span>
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white mt-1">{req.city}</p>
              </div>
            </div>

            <div className="bg-red-50/70 dark:bg-red-950/15 border border-red-200/80 dark:border-red-900/30 rounded-2xl p-6 text-center mt-6 transition-colors">
              <span className="text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-wider flex items-center justify-center gap-1.5 mb-1">
                <Phone className="w-3.5 h-3.5 text-red-655 dark:text-red-400" />
                <span>Family Contact Phone</span>
              </span>
              <a href={`tel:${req.contactPhone}`} className="text-3xl font-black text-red-600 dark:text-red-400 hover:underline tracking-tight block mt-1">
                {req.contactPhone}
              </a>
              <span className="text-xs text-red-600/80 dark:text-red-400/80 font-medium mt-2 block">Tap to call family directly</span>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs text-gray-400 dark:text-slate-550">
            <span>Verified Request · BloodMatch Engine</span>
            <span>ID: {req._id}</span>
          </div>
        </div>

        {/* Right Column: Quick Share Tools */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-8 shadow-sm space-y-4 transition-colors duration-300">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>🚀</span>
              <span>1-Click Amplification</span>
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
              Copy fully formatted graphic texts or export straight to community broadcast groups instantly.
            </p>

            <div className="space-y-3 mt-6 pt-2">
              {/* WhatsApp Button */}
              <button
                type="button"
                onClick={handleCopyWhatsapp}
                className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold py-3.5 px-5 rounded-2xl transition flex items-center justify-center gap-2.5 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/50"
              >
                <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" />
                <span>{copiedWhatsapp ? "✓ WhatsApp Text Copied!" : "Copy Formatted WhatsApp Text"}</span>
              </button>

              {/* Twitter / X Button */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3.5 px-5 rounded-2xl transition flex items-center justify-center gap-2.5 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-black/50"
              >
                <Twitter className="w-5 h-5 fill-white" />
                <span>Share Urgent Request on X</span>
              </a>

              {/* Native Mobile Share */}
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full border-2 border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-800 dark:text-slate-200 font-semibold py-3.5 px-5 rounded-2xl transition flex items-center justify-center gap-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <Smartphone className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                <span>Mobile System Share Sheet</span>
              </button>
            </div>
          </div>

          {/* Copy Direct Public Link Box */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-8 shadow-sm transition-colors duration-300">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Direct Public Link</h4>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-655 dark:text-slate-350 text-xs rounded-xl px-3.5 py-3 w-full font-mono focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="bg-gray-100 dark:bg-slate-800 hover:bg-red-600 hover:text-white dark:hover:bg-red-655 text-gray-700 dark:text-slate-300 font-semibold px-4 py-3 rounded-xl transition flex items-center gap-1.5 shrink-0 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                {copiedLink ? <Check className="w-4 h-4 text-green-600 animate-fadeIn" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Are you a donor? Banner */}
          <div className="bg-red-50/80 dark:bg-red-950/10 border border-red-200/80 dark:border-red-900/30 rounded-3xl p-6 text-center transition-colors">
            <span className="text-2xl block mb-2">🤝</span>
            <h4 className="text-sm font-bold text-red-900 dark:text-red-300">Are you a blood donor?</h4>
            <p className="text-xs text-red-700 dark:text-red-400 mt-1 max-w-xs mx-auto">
              If you or your friends have <strong>{req.bloodType}</strong> blood and can donate, please call the family directly or log in to fulfill the request.
            </p>
            <Link
              href={`/dashboard/match?bloodType=${encodeURIComponent(req.bloodType)}&city=${encodeURIComponent(req.city)}`}
              className="inline-block mt-4 text-xs font-bold bg-white dark:bg-slate-800 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-slate-700 border border-red-200 dark:border-red-900/30 px-4 py-2 rounded-xl transition shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              Verify Matches on Engine →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={<div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mt-20" />}>
      <ShareSuite />
    </Suspense>
  );
}
