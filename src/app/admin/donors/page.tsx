"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { BLOOD_TYPES, CITIES } from "@/lib/constants";
import { toast } from "sonner";
import {
  HeartHandshake, Trash2, RefreshCw, Filter, AlertTriangle,
  ChevronLeft, ChevronRight, Search, ToggleLeft, ToggleRight,
  Calendar, Check, AlertCircle, Pencil, X
} from "lucide-react";
import { PremiumSelect } from "@/components/ui/PremiumSelect";

interface AdminDonor {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  bloodType: string;
  city: string;
  isAvailable: boolean;
  lastDonatedAt?: string;
  createdAt: string;
}

export default function AdminDonorsPage() {
  const router = useRouter();
  const [donors, setDonors] = useState<AdminDonor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterAvailability, setFilterAvailability] = useState("all"); // all, available, unavailable
  const [filterBloodType, setFilterBloodType] = useState("all");
  const [filterCity, setFilterCity] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  // Edit modal state
  const [editDonor, setEditDonor] = useState<AdminDonor | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    bloodType: "",
    isAvailable: true,
    password: "",
  });

  const LIMIT = 20;

  const fetchDonors = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        role: "donor",
        bloodType: filterBloodType,
        city: filterCity === "all" ? "" : filterCity,
        search: search,
      });

      if (filterAvailability === "available") params.append("isAvailable", "true");
      if (filterAvailability === "unavailable") params.append("isAvailable", "false");

      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Failed to load donors");
      const data = await res.json();
      
      setDonors(data.users || []);
      setTotal(data.total || 0);
    } catch {
      setError("Failed to load donor database.");
    } finally {
      setLoading(false);
    }
  }, [page, filterBloodType, filterCity, filterAvailability, search]);

  useEffect(() => {
    fetchDonors();
  }, [fetchDonors]);

  const handleUpdateDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDonor) return;
    setActionLoading("edit");
    try {
      const updatePayload: Record<string, any> = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        city: editForm.city,
        bloodType: editForm.bloodType,
        isAvailable: editForm.isAvailable,
        role: "donor",
      };
      if (editForm.password) updatePayload.password = editForm.password;

      const res = await fetch(`/api/admin/users/${editDonor._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(updatePayload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      toast.success("Donor updated successfully.");
      setEditDonor(null);
      fetchDonors();
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Update failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleAvailability = async (id: string, current: boolean) => {
    setActionLoading(id + "toggle");
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ isAvailable: !current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Donor availability status updated.");
      setDonors((prev) => prev.map((d) => d._id === id ? { ...d, isAvailable: !current } : d));
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Update failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id + "delete");
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Donor record removed successfully.");
      setDeleteConfirm(null);
      fetchDonors();
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Delete failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (donor: AdminDonor) => {
    setEditDonor(donor);
    setEditForm({
      name: donor.name,
      email: donor.email,
      phone: donor.phone,
      city: donor.city,
      bloodType: donor.bloodType,
      isAvailable: donor.isAvailable,
      password: "",
    });
  };

  const getEligibility = (lastDonatedAt?: string) => {
    if (!lastDonatedAt) return { eligible: true, text: "Eligible (Never Donated)", daysLeft: 0 };
    const lastDate = new Date(lastDonatedAt);
    const diffTime = Math.abs(new Date().getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 90) {
      return { eligible: true, text: "Eligible", daysLeft: 0 };
    } else {
      return { eligible: false, text: `Resting (${90 - diffDays} days left)`, daysLeft: 90 - diffDays };
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Edit Donor Modal */}
      {editDonor && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-105 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-slate-900 dark:text-white font-black text-lg">Edit Donor Registry Profile</h3>
              <button 
                onClick={() => setEditDonor(null)} 
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateDonor} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Donor Full Name</label>
                <input 
                  required 
                  type="text" 
                  value={editForm.name} 
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all" 
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Email</label>
                  <input 
                    required 
                    type="email" 
                    value={editForm.email} 
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Reset Password (Optional)</label>
                  <input 
                    type="password" 
                    placeholder="Leave blank to keep current" 
                    value={editForm.password} 
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-555 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Phone Number</label>
                  <input 
                    required 
                    type="text" 
                    value={editForm.phone} 
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Blood Type</label>
                  <PremiumSelect
                    value={editForm.bloodType}
                    onChange={(val) => setEditForm({ ...editForm, bloodType: val })}
                    options={BLOOD_TYPES.map((t) => ({ value: t, label: t }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">City</label>
                <PremiumSelect
                  value={editForm.city}
                  onChange={(val) => setEditForm({ ...editForm, city: val })}
                  options={CITIES.map((c) => ({ value: c, label: c }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="editDonorAvailable" 
                  checked={editForm.isAvailable} 
                  onChange={(e) => setEditForm({ ...editForm, isAvailable: e.target.checked })} 
                  className="rounded border-slate-300 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-red-600 focus:ring-2 focus:ring-red-500/50 focus:ring-offset-0 focus:outline-none h-4 w-4" 
                />
                <label htmlFor="editDonorAvailable" className="text-xs font-bold text-slate-500 dark:text-slate-400 select-none">Active / Available for donations</label>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditDonor(null)} 
                  className="flex-1 py-2.5 rounded-xl bg-slate-105 dark:bg-slate-800 text-slate-705 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition focus:outline-none focus:ring-2 focus:ring-slate-500/50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading === "edit"} 
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                >
                  {actionLoading === "edit" ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-slate-900 dark:text-white font-black text-center text-lg mb-2">Remove Donor?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-6">This will permanently delete the donor&apos;s registry entry and account details.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirm(null)} 
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition focus:outline-none focus:ring-2 focus:ring-slate-500/50"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(deleteConfirm)} 
                disabled={!!actionLoading} 
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                {actionLoading ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <HeartHandshake className="w-7 h-7 text-red-500" />
            Donor Registry
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{total} registered blood donors</p>
        </div>
        <button 
          onClick={fetchDonors} 
          disabled={loading} 
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-750 transition focus:outline-none focus:ring-2 focus:ring-red-500/50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-500" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-2xl p-4 flex flex-wrap gap-3 items-center shadow-2xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search donors by name, email or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold pl-10 pr-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-750 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <div className="w-40">
            <PremiumSelect
              value={filterAvailability}
              onChange={(val) => { setFilterAvailability(val); setPage(1); }}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "available", label: "Active / Available" },
                { value: "unavailable", label: "Inactive / Unavailable" }
              ]}
            />
          </div>
          <div className="w-40">
            <PremiumSelect
              value={filterBloodType}
              onChange={(val) => { setFilterBloodType(val); setPage(1); }}
              options={[
                { value: "all", label: "All Blood Types" },
                ...BLOOD_TYPES.map((bt) => ({ value: bt, label: bt }))
              ]}
            />
          </div>
          <div className="w-40">
            <PremiumSelect
              value={filterCity}
              onChange={(val) => { setFilterCity(val); setPage(1); }}
              options={[
                { value: "all", label: "All Cities" },
                ...CITIES.map((c) => ({ value: c, label: c }))
              ]}
            />
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 rounded-xl p-4 text-sm font-bold">{error}</div>}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 flex items-center justify-center"><RefreshCw className="w-6 h-6 text-red-500 animate-spin" /></div>
        ) : donors.length === 0 ? (
          <div className="p-12 text-center">
            <Search className="w-10 h-10 text-slate-350 dark:text-slate-650 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-bold">No donors found matching criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Donor Info</th>
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Blood Type</th>
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">City</th>
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Contact</th>
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Availability</th>
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Last Donated</th>
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Eligibility</th>
                  <th className="text-right text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850/80">
                {donors.map((donor) => {
                  const eligibility = getEligibility(donor.lastDonatedAt);
                  return (
                    <tr key={donor._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-black text-slate-900 dark:text-white text-xs">{donor.name}</p>
                        <p className="text-slate-500 dark:text-slate-450 text-[10px] mt-0.5">{donor.email}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-block bg-red-50 dark:bg-red-950/30 text-red-605 dark:text-red-400 border border-red-200 dark:border-red-900/40 text-xs font-black px-2.5 py-0.5 rounded-lg">
                          {donor.bloodType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5"><p className="text-slate-700 dark:text-slate-300 text-xs font-bold">{donor.city}</p></td>
                      <td className="px-4 py-3.5"><p className="text-slate-650 dark:text-slate-400 text-xs font-mono">{donor.phone}</p></td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => handleToggleAvailability(donor._id, donor.isAvailable)}
                          disabled={actionLoading === donor._id + "toggle"}
                          title="Toggle donor availability"
                          className="flex items-center gap-1.5 transition-all disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded-lg p-0.5"
                        >
                          {donor.isAvailable ? (
                            <ToggleRight className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-slate-400 dark:text-slate-655" />
                          )}
                          <span className={`text-[10px] font-bold ${donor.isAvailable ? "text-emerald-500" : "text-slate-500"}`}>
                            {donor.isAvailable ? "Active" : "Inactive"}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        {donor.lastDonatedAt ? (
                          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            <span className="text-xs font-bold">
                              {new Date(donor.lastDonatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-xs font-medium italic">Never</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {eligibility.eligible ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg border bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border-emerald-250 dark:border-emerald-900/40 uppercase tracking-wider">
                            <Check className="w-3.5 h-3.5" />
                            {eligibility.text}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg border bg-amber-55/20 dark:bg-amber-955/20 text-amber-700 dark:text-amber-500 border-amber-250 dark:border-amber-900/40 uppercase tracking-wider">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {eligibility.text}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(donor)}
                            disabled={!!actionLoading}
                            title="Edit donor registry"
                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-red-50 dark:bg-slate-800/40 dark:hover:bg-red-950/20 text-slate-450 hover:text-red-650 dark:text-slate-500 dark:hover:text-red-400 flex items-center justify-center transition-all disabled:opacity-40 border border-slate-200 hover:border-red-200 dark:border-slate-700 dark:hover:border-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(donor._id)}
                            disabled={!!actionLoading}
                            title="Delete donor account"
                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-red-55 dark:bg-slate-800/40 dark:hover:bg-red-950/20 text-slate-455 hover:text-red-650 dark:text-slate-550 dark:hover:text-red-400 flex items-center justify-center transition-all disabled:opacity-40 border border-slate-200 hover:border-red-200 dark:border-slate-700 dark:hover:border-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-450 font-bold">Page {page} of {totalPages} · {total} total</p>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage((p) => Math.max(1, p - 1))} 
              disabled={page <= 1} 
              className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 flex items-center justify-center transition focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))} 
              disabled={page >= totalPages} 
              className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 flex items-center justify-center transition focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
