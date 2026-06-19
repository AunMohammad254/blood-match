"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser } from "@/lib/auth";
import { BLOOD_TYPES, CITIES } from "@/lib/constants";
import {
  CheckCircle, XCircle, Trash2, RefreshCw, Filter,
  AlertTriangle, Clock, ChevronLeft, ChevronRight, Search,
  Plus, Pencil, X
} from "lucide-react";

interface AdminRequest {
  _id: string;
  patientName: string;
  bloodType: string;
  units: number;
  hospital: string;
  city: string;
  urgency: "normal" | "urgent" | "critical";
  contactPhone: string;
  status: string;
  requestedBy: { _id: string; name: string; city: string; email: string } | string;
  createdAt: string;
}

const STATUS_OPTIONS = ["all", "open", "accepted", "rejected", "fulfilled", "cancelled"];

const urgencyColors: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/40",
  urgent: "bg-orange-500/20 text-orange-400 border-orange-500/40",
  normal: "bg-blue-500/20 text-blue-400 border-blue-500/40",
};

const statusColors: Record<string, string> = {
  open: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  accepted: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  rejected: "bg-red-500/20 text-red-400 border-red-500/40",
  fulfilled: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  cancelled: "bg-gray-500/20 text-gray-400 border-gray-500/40",
};

export default function AdminRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterBloodType, setFilterBloodType] = useState("all");
  const [filterCity, setFilterCity] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editRequest, setEditRequest] = useState<AdminRequest | null>(null);

  // Forms state
  const [createForm, setCreateForm] = useState({
    patientName: "",
    bloodType: "A+",
    units: 1,
    hospital: "",
    city: "Karachi",
    urgency: "urgent",
    contactPhone: "",
    requestedBy: "",
  });

  const [editForm, setEditForm] = useState({
    patientName: "",
    bloodType: "",
    units: 1,
    hospital: "",
    city: "",
    urgency: "",
    contactPhone: "",
    status: "",
  });

  const LIMIT = 20;

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const user = getUser();
    if (user && user.id) {
      setCreateForm((prev) => ({ ...prev, requestedBy: user.id }));
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        status: filterStatus,
        bloodType: filterBloodType,
        city: filterCity === "all" ? "" : filterCity,
        search: search,
      });
      const res = await fetch(`/api/admin/requests?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setRequests(data.requests || []);
      setTotal(data.total || 0);
    } catch {
      setError("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterBloodType, filterCity, search]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("create");
    try {
      const res = await fetch("/api/admin/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          ...createForm,
          units: Number(createForm.units),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      showToast("Blood request created successfully.", "success");
      setCreateModalOpen(false);
      const user = getUser();
      setCreateForm({
        patientName: "",
        bloodType: "A+",
        units: 1,
        hospital: "",
        city: "Karachi",
        urgency: "urgent",
        contactPhone: "",
        requestedBy: user?.id || "",
      });
      fetchRequests();
      router.refresh();
    } catch (err: any) {
      showToast(err.message || "Create failed.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRequest) return;
    setActionLoading("edit");
    try {
      const res = await fetch(`/api/admin/requests/${editRequest._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          ...editForm,
          units: Number(editForm.units),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      showToast("Blood request updated successfully.", "success");
      setEditRequest(null);
      fetchRequests();
      router.refresh();
    } catch (err: any) {
      showToast(err.message || "Update failed.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAction = async (id: string, action: "accept" | "reject") => {
    setActionLoading(id + action);
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Request ${action === "accept" ? "accepted" : "rejected"} successfully.`, "success");
      fetchRequests();
      router.refresh();
    } catch (e: any) {
      showToast(e.message || "Action failed.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setActionLoading(id + "status");
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("Request status updated.", "success");
      fetchRequests();
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
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("Request deleted.", "success");
      setDeleteConfirm(null);
      fetchRequests();
      router.refresh();
    } catch (e: any) {
      showToast(e.message || "Delete failed.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (req: AdminRequest) => {
    setEditRequest(req);
    setEditForm({
      patientName: req.patientName,
      bloodType: req.bloodType,
      units: req.units,
      hospital: req.hospital,
      city: req.city,
      urgency: req.urgency,
      contactPhone: req.contactPhone,
      status: req.status,
    });
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

      {/* Create Request Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col my-8">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-white font-black text-lg">Create Emergency Blood Request</h3>
              <button onClick={() => setCreateModalOpen(false)} className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Patient Name</label>
                <input required type="text" value={createForm.patientName} onChange={(e) => setCreateForm({ ...createForm, patientName: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Blood Type Required</label>
                  <select value={createForm.bloodType} onChange={(e) => setCreateForm({ ...createForm, bloodType: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500">
                    {BLOOD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Units Needed (1-20)</label>
                  <input required type="number" min="1" max="20" value={createForm.units} onChange={(e) => setCreateForm({ ...createForm, units: Number(e.target.value) })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Hospital / Medical Center</label>
                <input required type="text" value={createForm.hospital} onChange={(e) => setCreateForm({ ...createForm, hospital: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">City</label>
                  <select value={createForm.city} onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500">
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Urgency Level</label>
                  <select value={createForm.urgency} onChange={(e) => setCreateForm({ ...createForm, urgency: e.target.value as any })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500">
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Contact Phone</label>
                  <input required type="text" value={createForm.contactPhone} onChange={(e) => setCreateForm({ ...createForm, contactPhone: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Requested By (User ID)</label>
                  <input required type="text" value={createForm.requestedBy} onChange={(e) => setCreateForm({ ...createForm, requestedBy: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-red-500" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setCreateModalOpen(false)} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 font-bold text-xs hover:bg-gray-700 transition">Cancel</button>
                <button type="submit" disabled={actionLoading === "create"} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition disabled:opacity-50">
                  {actionLoading === "create" ? "Creating..." : "Create Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Request Modal */}
      {editRequest && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col my-8">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-white font-black text-lg">Edit Blood Request Details</h3>
              <button onClick={() => setEditRequest(null)} className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleUpdateRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Patient Name</label>
                <input required type="text" value={editForm.patientName} onChange={(e) => setEditForm({ ...editForm, patientName: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Blood Type</label>
                  <select value={editForm.bloodType} onChange={(e) => setEditForm({ ...editForm, bloodType: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500">
                    {BLOOD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Units Required</label>
                  <input required type="number" min="1" max="20" value={editForm.units} onChange={(e) => setEditForm({ ...editForm, units: Number(e.target.value) })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Hospital / Medical Center</label>
                <input required type="text" value={editForm.hospital} onChange={(e) => setEditForm({ ...editForm, hospital: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">City</label>
                  <select value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500">
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Urgency Level</label>
                  <select value={editForm.urgency} onChange={(e) => setEditForm({ ...editForm, urgency: e.target.value as any })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500">
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Contact Phone</label>
                  <input required type="text" value={editForm.contactPhone} onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Status</label>
                  <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500">
                    <option value="open">Open</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="fulfilled">Fulfilled</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setEditRequest(null)} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 font-bold text-xs hover:bg-gray-700 transition">Cancel</button>
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
            <h3 className="text-white font-black text-center text-lg mb-2">Delete Request?</h3>
            <p className="text-gray-400 text-sm text-center mb-6">This action cannot be undone. The blood request will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 font-bold text-sm hover:bg-gray-700 transition">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={!!actionLoading} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition disabled:opacity-50">
                {actionLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Blood Requests</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total requests</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition shadow-lg shadow-red-600/10">
            <Plus className="w-3.5 h-3.5" />
            <span>Create Request</span>
          </button>
          <button onClick={fetchRequests} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold border border-gray-700 transition">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-400" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by patient, hospital or city..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-gray-800 text-white text-xs font-bold pl-10 pr-4 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-red-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="bg-gray-800 text-white text-xs font-bold px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-red-500 capitalize">
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
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

      {error && (
        <div className="bg-red-950/40 border border-red-800/50 text-red-300 rounded-xl p-4 text-sm font-bold">{error}</div>
      )}

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center"><RefreshCw className="w-6 h-6 text-red-500 animate-spin" /></div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center"><Search className="w-10 h-10 text-gray-700 mx-auto mb-3" /><p className="text-gray-500 font-bold">No requests found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">Patient / Request</th>
                  <th className="text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">Blood / Units</th>
                  <th className="text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">Hospital / City</th>
                  <th className="text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">Urgency</th>
                  <th className="text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">Posted By</th>
                  <th className="text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">Date</th>
                  <th className="text-right text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {requests.map((req) => {
                  const postedBy = typeof req.requestedBy === "object" ? req.requestedBy : { name: "Unknown", city: "", email: "" };
                  const isActioning = actionLoading && actionLoading.startsWith(req._id);
                  return (
                    <tr key={req._id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-black text-white text-xs">{req.patientName}</p>
                        <p className="text-gray-600 text-[10px] mt-0.5 font-mono">{req._id.slice(-8)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-black px-2 py-0.5 rounded-lg">
                          {req.bloodType}
                        </span>
                        <p className="text-gray-400 text-[10px] mt-1 font-bold">{req.units} unit{req.units !== 1 ? "s" : ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-300 text-xs font-bold">{req.hospital}</p>
                        <p className="text-gray-500 text-[10px] mt-0.5">{req.city}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider ${urgencyColors[req.urgency] || ""}`}>
                          {req.urgency}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={req.status}
                          disabled={actionLoading === req._id + "status"}
                          onChange={(e) => handleStatusChange(req._id, e.target.value)}
                          className={`text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider bg-transparent cursor-pointer focus:outline-none ${statusColors[req.status] || ""}`}
                        >
                          {STATUS_OPTIONS.filter(s => s !== "all").map(s => (
                            <option key={s} value={s} className="bg-gray-900 text-white">{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-300 text-xs font-bold">{postedBy.name}</p>
                        <p className="text-gray-600 text-[10px] mt-0.5">{postedBy.city}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-500 text-[10px] font-mono">
                          {new Date(req.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {req.status === "open" && (
                            <>
                              <button
                                onClick={() => handleAction(req._id, "accept")}
                                disabled={!!isActioning}
                                title="Accept Request"
                                className="w-8 h-8 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 flex items-center justify-center transition-all disabled:opacity-40 border border-emerald-500/30 hover:border-emerald-500/60"
                              >
                                {isActioning === req._id + "accept" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleAction(req._id, "reject")}
                                disabled={!!isActioning}
                                title="Reject Request"
                                className="w-8 h-8 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 flex items-center justify-center transition-all disabled:opacity-40 border border-red-500/30 hover:border-red-500/60"
                              >
                                {isActioning === req._id + "reject" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => openEditModal(req)}
                            disabled={!!isActioning}
                            title="Edit blood request"
                            className="w-8 h-8 rounded-lg bg-gray-700/40 hover:bg-red-600/20 text-gray-500 hover:text-red-400 flex items-center justify-center transition-all disabled:opacity-40 border border-gray-700 hover:border-red-500/30"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(req._id)}
                            disabled={!!isActioning}
                            title="Delete Request"
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
