"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser, getToken, saveAuth, logout } from "@/lib/auth";
import { User } from "@/types";
import { BLOOD_TYPES, CITIES } from "@/lib/constants";
import { User as UserIcon, Phone, MapPin, Droplets, Save, LogOut, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    setUser(u);
    setIsAvailable(u.isAvailable ?? true);
  }, [router]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAvailabilityToggle = async () => {
    if (!user || user.role !== "donor") return;
    const token = getToken();
    if (!token) return;

    setIsSaving(true);
    try {
      const newAvailable = !isAvailable;
      const res = await fetch("/api/donors/availability", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAvailable: newAvailable }),
      });

      if (res.ok) {
        setIsAvailable(newAvailable);
        const updatedUser = { ...user, isAvailable: newAvailable };
        setUser(updatedUser);
        saveAuth(token, updatedUser);
        showToast("success", `You are now ${newAvailable ? "available" : "unavailable"} for donations.`);
      } else {
        const data = await res.json();
        showToast("error", data.error || "Failed to update availability.");
      }
    } catch {
      showToast("error", "Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold transition-all ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {toast.message}
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900">{user.name}</h1>
                <p className="text-sm text-gray-500 font-medium">{user.email}</p>
                <span
                  className={`mt-1 inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    user.role === "donor"
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {user.role === "donor" ? "🩸 Donor" : "🏥 Recipient"}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 font-semibold transition-colors px-3 py-2 rounded-xl hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-base font-black text-gray-800 uppercase tracking-wider mb-6">Profile Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InfoRow icon={<Droplets className="w-4 h-4 text-red-600" />} label="Blood Type" value={user.bloodType} valueClass="text-red-600 font-black text-lg" />
            <InfoRow icon={<MapPin className="w-4 h-4 text-blue-600" />} label="City" value={user.city} />
            <InfoRow icon={<Phone className="w-4 h-4 text-green-600" />} label="Phone" value={user.phone} />
            <InfoRow icon={<UserIcon className="w-4 h-4 text-purple-600" />} label="Member Since" value={joinDate} />
          </div>
        </div>

        {/* Availability Toggle (donors only) */}
        {user.role === "donor" && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <h2 className="text-base font-black text-gray-800 uppercase tracking-wider mb-4">Availability Status</h2>
            <p className="text-sm text-gray-500 mb-6 font-medium">
              Toggle this to let recipients know whether you&apos;re currently available to donate blood.
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">
                  {isAvailable ? "🟢 Available for Donation" : "🔴 Not Available"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">
                  {isAvailable
                    ? "Donors can see your profile and contact you."
                    : "Your profile is hidden from search results."}
                </p>
              </div>
              <button
                id="availability-toggle-btn"
                onClick={handleAvailabilityToggle}
                disabled={isSaving}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none ${
                  isAvailable ? "bg-green-500" : "bg-gray-300"
                } disabled:opacity-60`}
                aria-label="Toggle availability"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin absolute inset-0 m-auto text-white" />
                ) : (
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
                      isAvailable ? "translate-x-7" : "translate-x-0"
                    }`}
                  />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-base font-black text-gray-800 uppercase tracking-wider mb-5">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 hover:bg-red-50 border border-gray-100 hover:border-red-200 text-gray-700 hover:text-red-700 font-semibold text-sm transition-all"
            >
              📊 View Dashboard
            </a>
            {user.role === "recipient" && (
              <a
                href="/dashboard/request/new"
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 hover:bg-red-50 border border-gray-100 hover:border-red-200 text-gray-700 hover:text-red-700 font-semibold text-sm transition-all"
              >
                🩸 Post Blood Request
              </a>
            )}
            <a
              href="/dashboard/match"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 hover:bg-red-50 border border-gray-100 hover:border-red-200 text-gray-700 hover:text-red-700 font-semibold text-sm transition-all"
            >
              🔍 Find Donors
            </a>
            <a
              href="/dashboard/my-requests"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 hover:bg-red-50 border border-gray-100 hover:border-red-200 text-gray-700 hover:text-red-700 font-semibold text-sm transition-all"
            >
              📋 My Requests
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  valueClass = "text-gray-900 font-bold",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{label}</p>
        <p className={`mt-0.5 text-sm ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}
