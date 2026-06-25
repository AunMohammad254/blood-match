"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser, getToken, saveAuth, logout, updateUser } from "@/lib/auth";
import { User } from "@/types";
import { BLOOD_TYPES, CITIES } from "@/lib/constants";
import { User as UserIcon, Phone, MapPin, Droplets, Save, LogOut, Loader2, Edit3, Key, X, Calendar, Trash2, Info, Heart, AlertCircle, ShieldCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { PremiumSelect } from "@/components/ui/PremiumSelect";
import { PremiumDatePicker } from "@/components/ui/PremiumDatePicker";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);

  // OTP State
  const [otpCode, setOtpCode] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({ name: "", phone: "", city: "", lastDonatedAt: "" });
  const [isEditing, setIsEditing] = useState(false);

  // Password form state
  const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Deletion state
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    setUser(u);
    setIsAvailable(u.isAvailable ?? true);
    setEditForm({ 
      name: u.name, 
      phone: u.phone, 
      city: u.city, 
      lastDonatedAt: u.lastDonatedAt ? new Date(u.lastDonatedAt).toISOString().split("T")[0] : "" 
    });
  }, [router]);

  const showToast = (type: "success" | "error", message: string) => {
    if (type === "success") {
      toast.success(message);
    } else {
      toast.error(message);
    }
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

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    setIsEditing(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        updateUser(data.user);
        setShowEditModal(false);
        showToast("success", "Profile updated successfully.");
      } else {
        showToast("error", data.error || "Failed to update profile.");
      }
    } catch {
      showToast("error", "Network error. Please try again.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      showToast("error", "New passwords do not match.");
      return;
    }

    const token = getToken();
    if (!token) return;

    setIsChangingPass(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passForm.currentPassword,
          newPassword: passForm.newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowPasswordModal(false);
        setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        showToast("success", "Password changed successfully.");
      } else {
        showToast("error", data.error || "Failed to change password.");
      }
    } catch {
      showToast("error", "Network error. Please try again.");
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleDeleteAccount = async () => {
    const token = getToken();
    if (!token) return;

    setIsDeleting(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        logout();
        router.push("/");
      } else {
        const data = await res.json();
        showToast("error", data.error || "Failed to delete account.");
      }
    } catch {
      showToast("error", "Network error. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleSendOtp = async () => {
    const token = getToken();
    if (!token) return;

    setIsSendingOtp(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast("success", "OTP sent successfully! Check your phone.");
        setShowOtpModal(true);
      } else {
        showToast("error", data.error || "Failed to send OTP.");
      }
    } catch {
      showToast("error", "Network error. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      showToast("error", "Please enter a valid 6-digit OTP.");
      return;
    }

    const token = getToken();
    if (!token) return;

    setIsVerifyingOtp(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ otp: otpCode }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("success", "Phone number verified successfully!");
        setShowOtpModal(false);
        setOtpCode("");
        if (user) {
          const updatedUser = { ...user, isPhoneVerified: true };
          setUser(updatedUser);
          updateUser(updatedUser);
        }
      } else {
        showToast("error", data.error || "Invalid OTP.");
      }
    } catch {
      showToast("error", "Network error. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        <Loader2 className="w-8 h-8 animate-spin text-red-650" />
      </div>
    );
  }

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  const lastDonationDate = user.lastDonatedAt
    ? new Date(user.lastDonatedAt).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })
    : "Never logged";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10 px-4 transition-colors duration-300">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-8 transition-colors duration-300">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">{user.name}</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{user.email}</p>
                <span
                  className={`mt-1 inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    user.role === "donor"
                      ? "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-450"
                      : "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-450"
                  }`}
                >
                  {user.role === "donor" ? "🩸 Donor" : "🏥 Recipient"}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 font-bold py-2.5 px-4 rounded-xl transition-all border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 font-semibold transition-all px-4 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent hover:border-red-100 dark:hover:border-red-950/30 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Stats Section (Donors Only) */}
        {user.role === "donor" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-red-600 to-rose-700 rounded-3xl p-6 text-white shadow-lg">
              <Heart className="w-6 h-6 mb-3 opacity-80" />
              <p className="text-2xl font-black">Verified</p>
              <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Profile Status</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
              <Droplets className="w-6 h-6 mb-3 text-red-650" />
              <p className="text-2xl font-black text-gray-900 dark:text-white">{user.bloodType}</p>
              <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Blood Type</p>
            </div>
          </div>
        )}

        {/* Info Grid */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-8 transition-colors duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-black text-gray-800 dark:text-slate-200 uppercase tracking-wider">Profile Details</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InfoRow icon={<Droplets className="w-4 h-4 text-red-650" />} label="Blood Type" value={user.bloodType} valueClass="text-red-650 dark:text-red-400 font-black text-lg" />
            <InfoRow icon={<MapPin className="w-4 h-4 text-blue-600" />} label="City" value={user.city} />
            <div className="flex items-start justify-between gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 transition-colors duration-300">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5">
                  <Phone className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Phone</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-gray-900 dark:text-white font-bold">{user.phone}</p>
                    {user.isPhoneVerified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 uppercase tracking-widest">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 uppercase tracking-widest">
                        <ShieldAlert className="w-3 h-3" /> Unverified
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {!user.isPhoneVerified && user.role === "donor" && (
                <button
                  onClick={handleSendOtp}
                  disabled={isSendingOtp}
                  className="text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 dark:text-amber-300 px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50 flex flex-shrink-0 items-center gap-1"
                >
                  {isSendingOtp ? <Loader2 className="w-3 h-3 animate-spin" /> : "Verify Now"}
                </button>
              )}
            </div>
            <InfoRow icon={<UserIcon className="w-4 h-4 text-purple-600" />} label="Member Since" value={joinDate} />
            {user.role === "donor" && (
              <InfoRow icon={<Calendar className="w-4 h-4 text-orange-650" />} label="Last Donation" value={lastDonationDate} />
            )}
          </div>
        </div>

        {/* Availability Toggle (donors only) */}
        {user.role === "donor" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-8 transition-colors duration-300">
            <h2 className="text-base font-black text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-4">Availability Status</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 font-medium">
              Toggle this to let recipients know whether you&apos;re currently available to donate blood.
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900 dark:text-white">
                  {isAvailable ? "🟢 Available for Donation" : "🔴 Not Available"}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 font-medium">
                  {isAvailable
                    ? "Donors can see your profile and contact you."
                    : "Your profile is hidden from search results."}
                </p>
              </div>
              <button
                id="availability-toggle-btn"
                onClick={handleAvailabilityToggle}
                disabled={isSaving}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 ${
                  isAvailable ? "bg-green-500" : "bg-gray-300 dark:bg-slate-700"
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

        {/* Account Security */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-8 transition-colors duration-300">
          <h2 className="text-base font-black text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-5">Account Security</h2>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 transition-colors duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                <Key className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Password</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">Securely managed</p>
              </div>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="text-sm font-bold text-red-650 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded-lg px-2 py-1"
            >
              Update Password
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50/50 dark:bg-red-950/10 rounded-3xl border border-red-100 dark:border-red-950/20 shadow-sm p-8 transition-colors duration-300">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-650 dark:text-red-400" />
            <h2 className="text-base font-black text-red-900 dark:text-red-300 uppercase tracking-wider">Danger Zone</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Deactivate Account</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Once deleted, your profile and history cannot be recovered.</p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 text-sm font-bold text-red-650 dark:text-red-400 border border-red-200 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-950/30 px-4 py-2.5 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-8 pb-10 transition-colors duration-300">
          <h2 className="text-base font-black text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-5">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800/40 hover:bg-red-50 dark:hover:bg-red-950/20 border border-gray-100 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-900/30 text-gray-700 dark:text-slate-200 hover:text-red-700 dark:hover:text-red-400 font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              📊 View Dashboard
            </a>
            {user.role === "recipient" && (
              <a
                href="/dashboard/request/new"
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800/40 hover:bg-red-50 dark:hover:bg-red-950/20 border border-gray-100 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-900/30 text-gray-700 dark:text-slate-200 hover:text-red-700 dark:hover:text-red-400 font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                🩸 Post Blood Request
              </a>
            )}
            <a
              href="/dashboard/match"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800/40 hover:bg-red-50 dark:hover:bg-red-950/20 border border-gray-100 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-900/30 text-gray-700 dark:text-slate-200 hover:text-red-700 dark:hover:text-red-400 font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              🔍 Find Donors
            </a>
            <a
              href="/dashboard/my-requests"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800/40 hover:bg-red-50 dark:hover:bg-red-950/20 border border-gray-100 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-900/30 text-gray-700 dark:text-slate-200 hover:text-red-700 dark:hover:text-red-400 font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              📋 My Requests
            </a>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-150 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Edit Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50">
                <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleEditProfile} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-medium text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-medium text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">City</label>
                <PremiumSelect
                  value={editForm.city}
                  onChange={(val) => setEditForm({ ...editForm, city: val })}
                  options={CITIES.map((city) => ({ value: city, label: city }))}
                  placeholder="Select City"
                />
              </div>
              {user.role === "donor" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    Last Donation Date
                    <div className="group relative">
                      <Info className="w-3 h-3 text-gray-400 dark:text-slate-500 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 dark:bg-slate-850 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Setting this helps calculate your next eligible donation date.
                      </div>
                    </div>
                  </label>
                  <PremiumDatePicker
                    selected={editForm.lastDonatedAt ? new Date(editForm.lastDonatedAt) : null}
                    onChange={(date) => {
                      setEditForm({ 
                        ...editForm, 
                        lastDonatedAt: date ? date.toISOString().split("T")[0] : "" 
                      });
                    }}
                    placeholderText="Select Date"
                  />
                </div>
              )}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-bold hover:bg-gray-100 dark:hover:bg-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="flex-[2] py-3.5 px-4 rounded-2xl bg-red-600 text-white font-black hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                >
                  {isEditing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-150 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50">
                <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">Current Password</label>
                <input
                  type="password"
                  required
                  value={passForm.currentPassword}
                  onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-medium text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passForm.newPassword}
                  onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-medium text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passForm.confirmPassword}
                  onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-medium text-gray-900 dark:text-white"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-bold hover:bg-gray-100 dark:hover:bg-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="flex-[2] py-3.5 px-4 rounded-2xl bg-red-600 text-white font-black hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                >
                  {isChangingPass ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border border-gray-150 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Delete Account?</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mb-8">
              Are you absolutely sure? This action will permanently remove your data and cannot be undone.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-full py-4 rounded-2xl bg-red-600 text-white font-black hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Yes, Delete Permanently"}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-full py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-bold hover:bg-gray-100 dark:hover:bg-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                Keep My Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border border-gray-150 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Verify Phone Number</h3>
              <button onClick={() => setShowOtpModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50">
                <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleVerifyOtp} className="p-6 text-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600 dark:text-amber-400">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mb-6">
                We sent a 6-digit OTP code to <strong className="text-gray-900 dark:text-white">{user.phone}</strong>. Please enter it below.
              </p>
              <div className="space-y-4">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="------"
                  className="w-full text-center tracking-[1em] text-2xl font-black px-4 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all text-gray-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={isVerifyingOtp || otpCode.length !== 6}
                  className="w-full py-4 rounded-2xl bg-red-600 text-white font-black hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                >
                  {isVerifyingOtp ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  valueClass = "text-gray-900 dark:text-white font-bold",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 transition-colors duration-300">
      <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 dark:text-slate-500 font-semibold uppercase tracking-wider">{label}</p>
        <p className={`mt-0.5 text-sm ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}
