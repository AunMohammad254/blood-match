"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { BLOOD_TYPES, CITIES } from "@/lib/constants";
import {
  HeartHandshake, Trash2, RefreshCw, Filter, AlertTriangle,
  ChevronLeft, ChevronRight, Search, ToggleLeft, ToggleRight, CheckCircle,
  Calendar, Check, AlertCircle, Pencil, X
} from "lucide-react";

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
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  
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

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

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
      showToast("Donor updated successfully.", "success");
      setEditDonor(null);
      fetchDonors();
      router.refresh();
    } catch (err: any) {
      showToast(err.message || "Update failed.", "error");
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
      showToast("Donor availability status updated.", "success");
      setDonors((prev) => prev.map((d) => d._id === id ? { ...d, isAvailable: !current } : d));
      router.refresh();
    } catch (e: any) {
      showToast(e.message || "Update failed.", "error");
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
      showToast("Donor record removed.", "success");
      setDeleteConfirm(null);
      fetchDonors();
      router.refresh();
    } catch (e: any) {
      showToast(e.message || "Delete failed.", "error");
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
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-sm font-bold flex items-center gap-2 animate-fadeIn ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Edit Donor Modal */}
      {editDonor && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col my-8">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-white font-black text-lg">Edit Donor Registry Profile</h3>
              <button onClick={() => setEditDonor(null)} className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleUpdateDonor} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Donor Full Name</label>
                <input required type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Email</label>
                  <input required type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Reset Password (Optional)</label>
                  <input type="password" placeholder="Leave blank to keep current" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Phone Number</label>
                  <input required type="text" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Blood Type</label>
                  <select value={editForm.bloodType} onChange={(e) => setEditForm({ ...editForm, bloodType: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500">
                    {BLOOD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">City</label>
                <select value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500">
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="editDonorAvailable" checked={editForm.isAvailable} onChange={(e) => setEditForm({ ...editForm, isAvailable: e.target.checked })} className="rounded border-gray-700 bg-gray-800 text-red-600 focus:ring-0 focus:ring-offset-0" />
                <label htmlFor="editDonorAvailable" className="text-xs font-bold text-gray-400 select-none">Active / Available for donations</label>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setEditDonor(null)} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 font-bold text-xs hover:bg-gray-700 transition">Cancel</button>
                <button type="submit" disabled={actionLoading === "edit"} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition disabled:opacity-50">
                  {actionLoading === "edit" ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-white font-black text-center text-lg mb-2">Remove Donor?</h3>
            <p className="text-gray-400 text-sm text-center mb-6">This will permanently delete the donor&apos;s registry entry and account details.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 font-bold text-sm hover:bg-gray-700 transition">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={!!actionLoading} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition disabled:opacity-50">
                {actionLoading ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <HeartHandshake className="w-7 h-7 text-red-500" />
            Donor Registry
          </h1>
          <p className="text-sm text-gray-500 mt-1">{total} registered blood donors</p>
        </div>
        <button onClick={fetchDonors} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold border border-gray-700 transition">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-400" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search donors by name, email or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-gray-800 text-white text-xs font-bold pl-10 pr-4 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-red-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <select value={filterAvailability} onChange={(e) => { setFilterAvailability(e.target.value); setPage(1); }} className="bg-gray-800 text-white text-xs font-bold px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-red-500">
            <option value="all">All Statuses</option>
            <option value="available">Active / Available</option>
            <option value="unavailable">Inactive / Unavailable</option>
          </select>
          <select value={filterBloodType} onChange={(e) => { setFilterBloodType(e.target.value); setPage(1); }} className="bg-gray-800 text-white text-xs font-bold px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-red-500">
            <option value="all">All Blood Types</option>
            {BLOOD_TYPES.map((bt) => <option key={bt} value={bt}>{bt}</option>)}
          </select>
          <select value={filterCity} onChange={(e) => { setFilterCity(e.target.value); setPage(1); }} className="bg-gray-800 text-white text-xs font-bold px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-red-500">
            <option value="all">All Cities</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="bg-red-950/40 border border-red-800/50 text-red-300 rounded-xl p-4 text-sm font-bold">{error}</div>}

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center"><RefreshCw className="w-6 h-6 text-red-500 animate-spin" /></div>
        ) : donors.length === 0 ? (
          <div className="p-12 text-center">
            <Search className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 font-bold">No donors found matching criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">Donor Info</th>
                  <th className="text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">Blood Type</th>
                  <th className="text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">City</th>
                  <th className="text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">Contact</th>
                  <th className="text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">Availability</th>
                  <th className="text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">Last Donated</th>
                  <th className="text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">Eligibility</th>
                  <th className="text-right text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {donors.map((donor) => {
                  const eligibility = getEligibility(donor.lastDonatedAt);
                  return (
                    <tr key={donor._id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-black text-white text-xs">{donor.name}</p>
                        <p className="text-gray-600 text-[10px] mt-0.5">{donor.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-black px-2.5 py-0.5 rounded-lg">
                          {donor.bloodType}
                        </span>
                      </td>
                      <td className="px-4 py-3"><p className="text-gray-300 text-xs font-bold">{donor.city}</p></td>
                      <td className="px-4 py-3"><p className="text-gray-400 text-xs font-mono">{donor.phone}</p></td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleAvailability(donor._id, donor.isAvailable)}
                          disabled={actionLoading === donor._id + "toggle"}
                          title="Toggle donor availability"
                          className="flex items-center gap-1.5 transition-all disabled:opacity-40"
                        >
                          {donor.isAvailable ? (
                            <ToggleRight className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-gray-600" />
                          )}
                          <span className={`text-[10px] font-bold ${donor.isAvailable ? "text-emerald-500" : "text-gray-600"}`}>
                            {donor.isAvailable ? "Active" : "Inactive"}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {donor.lastDonatedAt ? (
                          <div className="flex items-center gap-1 text-gray-400">
                            <Calendar className="w-3.5 h-3.5 text-gray-600" />
                            <span className="text-xs font-bold">
                              {new Date(donor.lastDonatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-600 text-xs font-medium italic">Never</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {eligibility.eligible ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg border bg-emerald-500/20 text-emerald-400 border-emerald-500/40 uppercase tracking-wider">
                            <Check className="w-3.5 h-3.5" />
                            {eligibility.text}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg border bg-yellow-500/20 text-yellow-500 border-yellow-500/40 uppercase tracking-wider">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {eligibility.text}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(donor)}
                            disabled={!!actionLoading}
                            title="Edit donor registry"
                            className="w-8 h-8 rounded-lg bg-gray-700/40 hover:bg-red-600/20 text-gray-500 hover:text-red-400 flex items-center justify-center transition-all disabled:opacity-40 border border-gray-700 hover:border-red-500/30"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(donor._id)}
                            disabled={!!actionLoading}
                            title="Delete donor account"
                            className="w-8 h-8 rounded-lg bg-gray-700/40 hover:bg-red-600/20 text-gray-500 hover:text-red-400 flex items-center justify-center transition-all disabled:opacity-40 border border-gray-700 hover:border-red-500/30"
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
          <p className="text-xs text-gray-500 font-bold">Page {page} of {totalPages} · {total} total</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 hover:text-white disabled:opacity-40 flex items-center justify-center transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 hover:text-white disabled:opacity-40 flex items-center justify-center transition">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
