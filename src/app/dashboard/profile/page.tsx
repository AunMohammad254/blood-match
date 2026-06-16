"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser, getToken, saveAuth, logout, updateUser } from "@/lib/auth";
import { User } from "@/types";
import { BLOOD_TYPES, CITIES } from "@/lib/constants";
import { User as UserIcon, Phone, MapPin, Droplets, Save, LogOut, CheckCircle, AlertCircle, Loader2, Edit3, Key, X, Calendar, Trash2, Info, Heart } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  const lastDonationDate = user.lastDonatedAt
    ? new Date(user.lastDonatedAt).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })
    : "Never logged";

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold transition-all ${
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
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
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
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-2.5 px-4 rounded-xl transition-all border border-gray-200"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-red-600 font-semibold transition-colors px-4 py-2.5 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100"
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
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <Droplets className="w-6 h-6 mb-3 text-red-600" />
              <p className="text-2xl font-black text-gray-900">{user.bloodType}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Blood Type</p>
            </div>
          </div>
        )}

        {/* Info Grid */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-black text-gray-800 uppercase tracking-wider">Profile Details</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InfoRow icon={<Droplets className="w-4 h-4 text-red-600" />} label="Blood Type" value={user.bloodType} valueClass="text-red-600 font-black text-lg" />
            <InfoRow icon={<MapPin className="w-4 h-4 text-blue-600" />} label="City" value={user.city} />
            <InfoRow icon={<Phone className="w-4 h-4 text-green-600" />} label="Phone" value={user.phone} />
            <InfoRow icon={<UserIcon className="w-4 h-4 text-purple-600" />} label="Member Since" value={joinDate} />
            {user.role === "donor" && (
              <InfoRow icon={<Calendar className="w-4 h-4 text-orange-600" />} label="Last Donation" value={lastDonationDate} />
            )}
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

        {/* Account Security */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-base font-black text-gray-800 uppercase tracking-wider mb-5">Account Security</h2>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                <Key className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Password</p>
                <p className="text-xs text-gray-400 font-medium">Securely managed</p>
              </div>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="text-sm font-bold text-red-600 hover:text-red-700 transition-colors"
            >
              Update Password
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50/50 rounded-3xl border border-red-100 shadow-sm p-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h2 className="text-base font-black text-red-900 uppercase tracking-wider">Danger Zone</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-gray-900">Deactivate Account</p>
              <p className="text-xs text-gray-500 font-medium">Once deleted, your profile and history cannot be recovered.</p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 text-sm font-bold text-red-600 border border-red-200 hover:bg-red-100 px-4 py-2.5 rounded-xl transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 pb-10">
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

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900">Edit Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleEditProfile} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider">City</label>
                <select
                  required
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium appearance-none"
                >
                  {CITIES.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              {user.role === "donor" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    Last Donation Date
                    <div className="group relative">
                      <Info className="w-3 h-3 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Setting this helps calculate your next eligible donation date.
                      </div>
                    </div>
                  </label>
                  <input
                    type="date"
                    value={editForm.lastDonatedAt}
                    onChange={(e) => setEditForm({ ...editForm, lastDonatedAt: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                  />
                </div>
              )}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-gray-50 text-gray-700 font-bold hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="flex-[2] py-3.5 px-4 rounded-2xl bg-red-600 text-white font-black hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Current Password</label>
                <input
                  type="password"
                  required
                  value={passForm.currentPassword}
                  onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passForm.newPassword}
                  onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passForm.confirmPassword}
                  onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-gray-50 text-gray-700 font-bold hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="flex-[2] py-3.5 px-4 rounded-2xl bg-red-600 text-white font-black hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Delete Account?</h3>
            <p className="text-sm text-gray-500 font-medium mb-8">
              Are you absolutely sure? This action will permanently remove your data and cannot be undone.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-full py-4 rounded-2xl bg-red-600 text-white font-black hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Yes, Delete Permanently"}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-full py-4 rounded-2xl bg-gray-50 text-gray-700 font-bold hover:bg-gray-100 transition-all"
              >
                Keep My Account
              </button>
            </div>
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

