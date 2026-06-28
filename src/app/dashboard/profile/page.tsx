"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser, getToken, saveAuth, logout, updateUser } from "@/lib/auth";
import { User } from "@/types";
import { CITIES } from "@/lib/constants";
import {
  User as UserIcon, Phone, MapPin, Droplets, LogOut, Loader2, Edit3,
  Key, X, Calendar, Trash2, Info, Heart, AlertCircle, ShieldCheck,
  ShieldAlert, Eye, EyeOff, Award, TrendingUp, Clock, CheckCircle2,
  Activity, Star, ChevronRight, Copy, Check
} from "lucide-react";
import { toast } from "sonner";
import { PremiumSelect } from "@/components/ui/PremiumSelect";
import { PremiumDatePicker } from "@/components/ui/PremiumDatePicker";

const COMPATIBILITY: Record<string, { canDonateTo: string[]; canReceiveFrom: string[] }> = {
  "A+":  { canDonateTo: ["A+", "AB+"],            canReceiveFrom: ["A+", "A-", "O+", "O-"] },
  "A-":  { canDonateTo: ["A+", "A-", "AB+", "AB-"], canReceiveFrom: ["A-", "O-"] },
  "B+":  { canDonateTo: ["B+", "AB+"],            canReceiveFrom: ["B+", "B-", "O+", "O-"] },
  "B-":  { canDonateTo: ["B+", "B-", "AB+", "AB-"], canReceiveFrom: ["B-", "O-"] },
  "AB+": { canDonateTo: ["AB+"],                   canReceiveFrom: ["A+","A-","B+","B-","AB+","AB-","O+","O-"] },
  "AB-": { canDonateTo: ["AB+", "AB-"],            canReceiveFrom: ["A-","B-","AB-","O-"] },
  "O+":  { canDonateTo: ["A+","B+","O+","AB+"],   canReceiveFrom: ["O+", "O-"] },
  "O-":  { canDonateTo: ["A+","A-","B+","B-","AB+","AB-","O+","O-"], canReceiveFrom: ["O-"] },
};

function getDaysUntilEligible(lastDonatedAt?: string): number | null {
  if (!lastDonatedAt) return null;
  const eligible = new Date(new Date(lastDonatedAt).getTime() + 56 * 24 * 60 * 60 * 1000);
  const diff = Math.ceil((eligible.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function getProfileCompletion(user: User): { score: number; missing: string[] } {
  const checks: [boolean, string][] = [
    [!!user.name,            "Full name"],
    [!!user.email,           "Email address"],
    [!!user.phone,           "Phone number"],
    [!!user.city,            "City"],
    [!!user.bloodType,       "Blood type"],
    [!!user.isPhoneVerified, "Phone verification"],
    [!!user.lastDonatedAt,   "Last donation date"],
  ];
  const done = checks.filter(([v]) => v).length;
  return {
    score: Math.round((done / checks.length) * 100),
    missing: checks.filter(([v]) => !v).map(([, l]) => l),
  };
}

function InfoRow({ icon, label, value, valueClass = "text-gray-900 dark:text-white font-bold" }: {
  icon: React.ReactNode; label: string; value: string; valueClass?: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 transition-colors duration-300">
      <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-gray-400 dark:text-slate-500 font-semibold uppercase tracking-wider">{label}</p>
        <p className={`mt-0.5 text-sm ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, sub, color = "red" }: {
  icon: React.ReactNode; value: string | number; label: string; sub?: string;
  color?: "red" | "green" | "amber" | "blue";
}) {
  const colors = {
    red:   "from-red-500 to-rose-600 shadow-red-500/30",
    green: "from-emerald-500 to-green-600 shadow-emerald-500/30",
    amber: "from-amber-500 to-orange-500 shadow-amber-500/30",
    blue:  "from-blue-500 to-indigo-600 shadow-blue-500/30",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-5 text-white shadow-lg`}>
      <div className="opacity-80 mb-2">{icon}</div>
      <p className="text-2xl font-black leading-none">{value}</p>
      <p className="text-xs font-bold opacity-80 uppercase tracking-widest mt-1">{label}</p>
      {sub && <p className="text-[10px] opacity-60 mt-1">{sub}</p>}
    </div>
  );
}

function PasswordInput({ value, onChange, required, label, minLength }: {
  value: string; onChange: (v: string) => void; required?: boolean; label: string; minLength?: number;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          required={required}
          minLength={minLength}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-4 py-3 pr-11 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-medium text-gray-900 dark:text-white"
        />
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors p-1">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "compatibility" | "security">("overview");
  const [copied, setCopied] = useState(false);

  const [showEditModal,     setShowEditModal]     = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal,   setShowDeleteModal]   = useState(false);
  const [showOtpModal,      setShowOtpModal]      = useState(false);

  const [otpCode,        setOtpCode]        = useState("");
  const [isSendingOtp,   setIsSendingOtp]   = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const [editForm,  setEditForm]  = useState({ name: "", phone: "", city: "", lastDonatedAt: "" });
  const [isEditing, setIsEditing] = useState(false);

  const [passForm,       setPassForm]       = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passStrength,   setPassStrength]   = useState(0);

  const [isDeleting,     setIsDeleting]     = useState(false);
  const [deleteConfirm,  setDeleteConfirm]  = useState("");

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace("/login"); return; }
    setUser(u);
    setIsAvailable(u.isAvailable ?? true);
    setEditForm({
      name: u.name, phone: u.phone, city: u.city,
      lastDonatedAt: u.lastDonatedAt ? new Date(u.lastDonatedAt).toISOString().split("T")[0] : "",
    });
  }, [router]);

  useEffect(() => {
    const p = passForm.newPassword;
    let s = 0;
    if (p.length >= 8)          s++;
    if (/[A-Z]/.test(p))        s++;
    if (/[0-9]/.test(p))        s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    setPassStrength(s);
  }, [passForm.newPassword]);

  const handleAvailabilityToggle = async () => {
    if (!user || user.role !== "donor") return;
    const token = getToken(); if (!token) return;
    setIsSaving(true);
    try {
      const newAvail = !isAvailable;
      const res = await fetch("/api/donors/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isAvailable: newAvail }),
      });
      if (res.ok) {
        setIsAvailable(newAvail);
        const u2 = { ...user, isAvailable: newAvail };
        setUser(u2); saveAuth(token, u2);
        toast.success(`You are now ${newAvail ? "available" : "unavailable"} for donations.`);
      } else { const d = await res.json(); toast.error(d.error || "Failed to update."); }
    } catch { toast.error("Network error."); } finally { setIsSaving(false); }
  };

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault(); const token = getToken(); if (!token) return;
    setIsEditing(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (res.ok) { setUser(data.user); updateUser(data.user); setShowEditModal(false); toast.success("Profile updated! 🎉"); }
      else { toast.error(data.error || "Failed to update profile."); }
    } catch { toast.error("Network error."); } finally { setIsEditing(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) { toast.error("Passwords do not match."); return; }
    const token = getToken(); if (!token) return;
    setIsChangingPass(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowPasswordModal(false);
        setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        toast.success("Password changed! 🔐");
      } else { toast.error(data.error || "Failed to change password."); }
    } catch { toast.error("Network error."); } finally { setIsChangingPass(false); }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") { toast.error('Type "DELETE" to confirm.'); return; }
    const token = getToken(); if (!token) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/user/profile", { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { logout(); router.push("/"); }
      else { const d = await res.json(); toast.error(d.error || "Failed to delete account."); }
    } catch { toast.error("Network error."); } finally { setIsDeleting(false); }
  };

  const handleSendOtp = async () => {
    const token = getToken(); if (!token) return;
    setIsSendingOtp(true);
    try {
      const res = await fetch("/api/auth/send-otp", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) { toast.success("OTP sent! Check your phone."); setShowOtpModal(true); }
      else { toast.error(data.error || "Failed to send OTP."); }
    } catch { toast.error("Network error."); } finally { setIsSendingOtp(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) { toast.error("Enter a valid 6-digit OTP."); return; }
    const token = getToken(); if (!token) return;
    setIsVerifyingOtp(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ otp: otpCode }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Phone verified! ✅");
        setShowOtpModal(false); setOtpCode("");
        if (user) { const u2 = { ...user, isPhoneVerified: true }; setUser(u2); updateUser(u2); }
      } else { toast.error(data.error || "Invalid OTP."); }
    } catch { toast.error("Network error."); } finally { setIsVerifyingOtp(false); }
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
      <div className="text-center space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-red-600 mx-auto" />
        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Loading your profile…</p>
      </div>
    </div>
  );

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })
    : "—";
  const lastDonationDate = user.lastDonatedAt
    ? new Date(user.lastDonatedAt).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })
    : "Never logged";

  const daysUntilEligible = getDaysUntilEligible(user.lastDonatedAt);
  const isInCooldown = daysUntilEligible !== null && daysUntilEligible > 0;
  const { score: profileScore, missing: profileMissing } = getProfileCompletion(user);
  const compat = user.bloodType ? COMPATIBILITY[user.bloodType] : null;
  const initials = user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  const strengthColors = ["bg-gray-200", "bg-red-400", "bg-amber-400", "bg-yellow-400", "bg-green-500"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  const tabs: ("overview" | "compatibility" | "security")[] = [
    "overview",
    ...(compat ? ["compatibility" as const] : []),
    "security",
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10 px-4 transition-colors duration-300">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Hero Card ─────────────────────────────────────────────────────── */}
        <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-500/5 to-rose-600/10 rounded-full -translate-y-20 translate-x-20 pointer-events-none" />
          <div className="p-7">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-red-500/25 ring-4 ring-red-100 dark:ring-red-950/40">
                  {initials}
                </div>
                {isAvailable && user.role === "donor" && (
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 shadow" title="Available" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-black text-gray-900 dark:text-white truncate">{user.name}</h1>
                  {user.isPhoneVerified && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mb-2">{user.email}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                    user.role === "donor"
                      ? "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                      : "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400"
                  }`}>
                    {user.role === "donor" ? "🩸 Donor" : "🏥 Recipient"}
                  </span>
                  {user.bloodType && (
                    <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400">
                      <Droplets className="w-3 h-3" /> {user.bloodType}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500">
                    <Calendar className="w-3 h-3" /> Joined {joinDate}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button onClick={() => setShowEditModal(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 font-bold py-2.5 px-4 rounded-xl transition-all border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/50">
                  <Edit3 className="w-4 h-4" /> Edit
                </button>
                <button onClick={() => { logout(); router.push("/"); }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 font-semibold transition-all px-4 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent hover:border-red-100 dark:hover:border-red-950/30 focus:outline-none focus:ring-2 focus:ring-red-500/50">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>

            {/* Profile Completion Bar */}
            <div className="mt-6 pt-5 border-t border-gray-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Profile Completeness</span>
                </div>
                <span className={`text-sm font-black ${profileScore === 100 ? "text-green-600 dark:text-green-400" : "text-gray-700 dark:text-slate-300"}`}>
                  {profileScore}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    profileScore === 100 ? "bg-green-500" : profileScore >= 70 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${profileScore}%` }}
                />
              </div>
              {profileMissing.length > 0 && (
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1.5">
                  Missing: {profileMissing.join(", ")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Phone Verification Banner ────────────────────────────────────── */}
        {!user.isPhoneVerified && (
          <div className="flex items-center justify-between gap-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl px-5 py-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-900 dark:text-amber-300">Phone not verified</p>
                <p className="text-xs text-amber-700 dark:text-amber-500">Unverified donors are filtered out by many hospitals.</p>
              </div>
            </div>
            <button onClick={handleSendOtp} disabled={isSendingOtp}
              className="flex items-center gap-1.5 text-xs font-black bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-xl transition-colors whitespace-nowrap flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-amber-500/50">
              {isSendingOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              Verify Now
            </button>
          </div>
        )}

        {/* ── Donor Stat Cards ─────────────────────────────────────────────── */}
        {user.role === "donor" && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={<Droplets className="w-5 h-5" />} value={user.bloodType || "—"} label="Blood Type" color="red" />
            <StatCard
              icon={<Star className="w-5 h-5" />}
              value={user.isPhoneVerified ? "Verified" : "Pending"}
              label="Trust Level"
              color={user.isPhoneVerified ? "green" : "amber"}
            />
            <StatCard
              icon={<Clock className="w-5 h-5" />}
              value={isInCooldown ? `${daysUntilEligible}d` : "Ready"}
              label={isInCooldown ? "Until Eligible" : "To Donate"}
              sub={isInCooldown ? "Cooldown active" : "Fully eligible"}
              color={isInCooldown ? "amber" : "green"}
            />
            <StatCard icon={<MapPin className="w-5 h-5" />} value={user.city || "—"} label="Location" color="blue" />
          </div>
        )}

        {/* ── Cooldown Notice ──────────────────────────────────────────────── */}
        {user.role === "donor" && isInCooldown && (
          <div className="flex items-center gap-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 rounded-2xl px-5 py-4">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-orange-900 dark:text-orange-300">Donation cooldown active</p>
              <p className="text-xs text-orange-700 dark:text-orange-500 mt-0.5">
                Last donated: <strong>{lastDonationDate}</strong>. Eligible again in <strong>{daysUntilEligible} days</strong>.
              </p>
            </div>
          </div>
        )}

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-slate-800/60 rounded-2xl border border-gray-200 dark:border-slate-700">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all capitalize ${
                activeTab === tab
                  ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── Tab: Overview ───────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            {/* Profile Details */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
              <h2 className="text-sm font-black text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-5">Profile Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={<Droplets className="w-4 h-4 text-red-600" />} label="Blood Type" value={user.bloodType || "—"} valueClass="text-red-600 dark:text-red-400 font-black text-lg" />
                <InfoRow icon={<MapPin className="w-4 h-4 text-blue-600" />} label="City" value={user.city || "—"} />

                {/* Phone row */}
                <div className="flex items-start justify-between gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 sm:col-span-2">
                  <div className="flex gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5">
                      <Phone className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Phone</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
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
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => { navigator.clipboard.writeText(user.phone); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                      className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-400">
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    {!user.isPhoneVerified && user.role === "donor" && (
                      <button onClick={handleSendOtp} disabled={isSendingOtp}
                        className="text-[11px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 dark:text-amber-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                        {isSendingOtp ? <Loader2 className="w-3 h-3 animate-spin" /> : "Verify"}
                      </button>
                    )}
                  </div>
                </div>

                <InfoRow icon={<UserIcon className="w-4 h-4 text-purple-600" />} label="Member Since" value={joinDate} />
                {user.role === "donor" && (
                  <InfoRow icon={<Calendar className="w-4 h-4 text-orange-500" />} label="Last Donation" value={lastDonationDate} />
                )}
              </div>
            </div>

            {/* Availability Toggle */}
            {user.role === "donor" && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
                <h2 className="text-sm font-black text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-2">Availability Status</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-5 font-medium">
                  Toggle to let recipients know you&apos;re ready to donate. This affects your visibility in searches.
                </p>
                <div className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${
                  isAvailable
                    ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30"
                    : "bg-gray-50 dark:bg-slate-800/40 border-gray-100 dark:border-slate-800"
                }`}>
                  <div>
                    <p className={`font-bold text-sm ${isAvailable ? "text-green-800 dark:text-green-300" : "text-gray-600 dark:text-slate-400"}`}>
                      {isAvailable ? "🟢 Available for Donation" : "🔴 Not Available Right Now"}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 font-medium">
                      {isAvailable ? "Your profile is visible to recipients." : "Your profile is hidden from search."}
                    </p>
                  </div>
                  <button
                    id="availability-toggle-btn"
                    onClick={handleAvailabilityToggle}
                    disabled={isSaving}
                    className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                      isAvailable ? "bg-green-500" : "bg-gray-300 dark:bg-slate-700"
                    } disabled:opacity-60`}
                    aria-label="Toggle availability"
                  >
                    {isSaving
                      ? <Loader2 className="w-4 h-4 animate-spin absolute inset-0 m-auto text-white" />
                      : <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${isAvailable ? "translate-x-7" : "translate-x-0"}`} />
                    }
                  </button>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
              <h2 className="text-sm font-black text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { href: "/dashboard",             label: "View Dashboard",    emoji: "📊" },
                  { href: "/dashboard/match",        label: "Find Donors",       emoji: "🔍" },
                  { href: "/dashboard/my-requests",  label: "My Requests",       emoji: "📋" },
                  { href: "/radar",                  label: "Tactical Radar",    emoji: "📡" },
                  ...(user.role === "recipient"
                    ? [{ href: "/dashboard/request/new", label: "Post Blood Request", emoji: "🩸" }]
                    : []),
                ].map(({ href, label, emoji }) => (
                  <a key={href} href={href}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/40 hover:bg-red-50 dark:hover:bg-red-950/20 border border-gray-100 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-900/30 text-gray-700 dark:text-slate-200 hover:text-red-700 dark:hover:text-red-400 font-semibold text-sm transition-all group focus:outline-none focus:ring-2 focus:ring-red-500/50">
                    <span>{emoji} {label}</span>
                    <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Compatibility ───────────────────────────────────────────── */}
        {activeTab === "compatibility" && compat && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-900 dark:text-white">Blood Type {user.bloodType}</h2>
                  <p className="text-xs text-gray-400 dark:text-slate-500">Compatibility Information</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <p className="text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-green-500" /> Can Donate To
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {compat.canDonateTo.map(t => (
                      <span key={t} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 text-green-800 dark:text-green-400 font-black text-sm">
                        <Droplets className="w-3.5 h-3.5" /> {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Heart className="w-3.5 h-3.5 text-red-500" /> Can Receive From
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {compat.canReceiveFrom.map(t => (
                      <span key={t} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-800 dark:text-red-400 font-black text-sm">
                        <Droplets className="w-3.5 h-3.5" /> {t}
                      </span>
                    ))}
                  </div>
                </div>
                {user.bloodType === "O-" && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl">
                    <Star className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-medium text-amber-900 dark:text-amber-300">
                      <strong>Universal Donor!</strong> O- can be transfused to any patient — you are critical in emergencies.
                    </p>
                  </div>
                )}
                {user.bloodType === "AB+" && (
                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-2xl">
                    <Star className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-medium text-blue-900 dark:text-blue-300">
                      <strong>Universal Recipient!</strong> AB+ can receive from all blood types.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Eligibility Checklist */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
              <h2 className="text-sm font-black text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-4">Donation Eligibility Checklist</h2>
              <div className="space-y-3">
                {[
                  { check: !isInCooldown,          label: "56-day cooldown passed",   detail: isInCooldown ? `${daysUntilEligible} days left` : "Fully eligible" },
                  { check: !!user.isPhoneVerified,  label: "Phone verified",           detail: user.isPhoneVerified ? "Verified" : "Not verified" },
                  { check: isAvailable,             label: "Marked as available",      detail: isAvailable ? "Active" : "Hidden" },
                  { check: !!user.city,             label: "Location set",             detail: user.city || "Not set" },
                ].map(({ check, label, detail }) => (
                  <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-3">
                      {check
                        ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        : <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                      <span className="text-sm font-medium text-gray-800 dark:text-slate-200">{label}</span>
                    </div>
                    <span className={`text-xs font-bold ${check ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Security ────────────────────────────────────────────────── */}
        {activeTab === "security" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
              <h2 className="text-sm font-black text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-5">Account Security</h2>
              <div className="space-y-3">
                {/* Password */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                      <Key className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">Password</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">Secured with bcrypt hashing</p>
                    </div>
                  </div>
                  <button onClick={() => setShowPasswordModal(true)}
                    className="text-sm font-bold text-red-600 dark:text-red-400 hover:text-red-700 transition-colors px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20">
                    Update
                  </button>
                </div>

                {/* Phone 2FA */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">Phone Verification</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">
                        {user.isPhoneVerified ? "Verified via OTP" : "Adds trust & visibility"}
                      </p>
                    </div>
                  </div>
                  {user.isPhoneVerified ? (
                    <span className="text-xs font-black text-green-600 dark:text-green-400 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" /> Active
                    </span>
                  ) : (
                    <button onClick={handleSendOtp} disabled={isSendingOtp}
                      className="text-sm font-bold text-amber-600 dark:text-amber-400 px-3 py-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors">
                      {isSendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enable"}
                    </button>
                  )}
                </div>

                {/* Account type */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                      <Award className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">Account Type</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 font-medium capitalize">{user.role} · Joined {joinDate}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                    user.role === "donor"  ? "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                    : user.role === "admin" ? "bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400"
                    : "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400"
                  }`}>{user.role}</span>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50/50 dark:bg-red-950/10 rounded-3xl border border-red-100 dark:border-red-950/20 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <h2 className="text-sm font-black text-red-900 dark:text-red-300 uppercase tracking-wider">Danger Zone</h2>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Delete Account Permanently</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-0.5">Cannot be undone. All data will be erased.</p>
                </div>
                <button onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-2 text-sm font-bold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-950/30 px-4 py-2.5 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50 whitespace-nowrap">
                  <Trash2 className="w-4 h-4" /> Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ MODAL: Edit Profile ════════════════════════════════════════════ */}
      {showEditModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-150 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">Edit Profile</h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Update your personal information</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleEditProfile} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">Full Name</label>
                <input type="text" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-medium text-gray-900 dark:text-white" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">Phone Number</label>
                <input type="tel" required value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-medium text-gray-900 dark:text-white" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">City</label>
                <PremiumSelect value={editForm.city} onChange={val => setEditForm({ ...editForm, city: val })}
                  options={CITIES.map(city => ({ value: city, label: city }))} placeholder="Select City" />
              </div>
              {user.role === "donor" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    Last Donation Date
                    <div className="group relative">
                      <Info className="w-3 h-3 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        Helps calculate your 56-day cooldown and eligibility.
                      </div>
                    </div>
                  </label>
                  <PremiumDatePicker
                    selected={editForm.lastDonatedAt ? new Date(editForm.lastDonatedAt) : null}
                    onChange={date => setEditForm({ ...editForm, lastDonatedAt: date ? date.toISOString().split("T")[0] : "" })}
                    placeholderText="Select Date" />
                </div>
              )}
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-bold hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isEditing}
                  className="flex-[2] py-3.5 px-4 rounded-2xl bg-red-600 text-white font-black hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {isEditing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL: Change Password ════════════════════════════════════════ */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-150 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">Change Password</h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Choose a strong password</p>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <PasswordInput label="Current Password" value={passForm.currentPassword} required onChange={v => setPassForm({ ...passForm, currentPassword: v })} />
              <PasswordInput label="New Password" value={passForm.newPassword} required minLength={8} onChange={v => setPassForm({ ...passForm, newPassword: v })} />

              {/* Strength bar */}
              {passForm.newPassword && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= passStrength ? strengthColors[passStrength] : "bg-gray-200 dark:bg-slate-700"}`} />
                    ))}
                  </div>
                  <p className={`text-[11px] font-bold ${passStrength >= 3 ? "text-green-600" : passStrength >= 2 ? "text-amber-600" : "text-red-500"}`}>
                    {strengthLabels[passStrength]}
                  </p>
                </div>
              )}

              <PasswordInput label="Confirm New Password" value={passForm.confirmPassword} required minLength={8} onChange={v => setPassForm({ ...passForm, confirmPassword: v })} />

              {passForm.confirmPassword && passForm.newPassword !== passForm.confirmPassword && (
                <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Passwords do not match
                </p>
              )}

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-bold hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isChangingPass}
                  className="flex-[2] py-3.5 px-4 rounded-2xl bg-red-600 text-white font-black hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {isChangingPass ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL: Delete Account ═════════════════════════════════════════ */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border border-gray-150 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Delete Account?</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mb-5">
              This is <strong className="text-red-600">permanent and irreversible</strong>. All data will be erased.
            </p>
            <div className="text-left mb-5">
              <label className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 block">
                Type <span className="text-red-600 font-black">DELETE</span> to confirm
              </label>
              <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="DELETE"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/50 font-bold text-gray-900 dark:text-white text-center tracking-widest" />
            </div>
            <div className="space-y-3">
              <button onClick={handleDeleteAccount} disabled={isDeleting || deleteConfirm !== "DELETE"}
                className="w-full py-4 rounded-2xl bg-red-600 text-white font-black hover:bg-red-700 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Yes, Delete Permanently"}
              </button>
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}
                className="w-full py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-bold hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
                Keep My Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: OTP Verification ═══════════════════════════════════════ */}
      {showOtpModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border border-gray-150 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Verify Phone</h3>
              <button onClick={() => setShowOtpModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleVerifyOtp} className="p-6 text-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600 dark:text-amber-400">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mb-6">
                6-digit code sent to <strong className="text-gray-900 dark:text-white">{user.phone}</strong>
              </p>
              <div className="space-y-4">
                <input type="text" required maxLength={6} value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full text-center tracking-[1em] text-2xl font-black px-4 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all text-gray-900 dark:text-white" />
                <button type="submit" disabled={isVerifyingOtp || otpCode.length !== 6}
                  className="w-full py-4 rounded-2xl bg-red-600 text-white font-black hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {isVerifyingOtp ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Now"}
                </button>
                <button type="button" onClick={handleSendOtp} disabled={isSendingOtp}
                  className="w-full py-2 text-sm text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 font-semibold transition-colors">
                  {isSendingOtp ? "Resending…" : "Didn't receive it? Resend OTP"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
