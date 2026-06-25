"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser } from "@/lib/auth";
import { BLOOD_TYPES, CITIES } from "@/lib/constants";
import { toast } from "sonner";
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
  isVerified?: boolean;
  reports?: number;
  requestedBy: { _id: string; name: string; city: string; email: string } | string;
  createdAt: string;
}

const STATUS_OPTIONS = ["all", "open", "accepted", "rejected", "fulfilled", "cancelled"];

const urgencyColors: Record<string, string> = {
  critical: "bg-red-55 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/40",
  urgent: "bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-450 border-orange-200 dark:border-orange-900/40",
  normal: "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/40",
};

const statusColors: Record<string, string> = {
  open: "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/40",
  accepted: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40",
  rejected: "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/40",
  fulfilled: "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-450 border-blue-200 dark:border-blue-900/40",
  cancelled: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700",
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
      toast.success("Blood request created successfully.");
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
      toast.error(err.message || "Create failed.");
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
      toast.success("Blood request updated successfully.");
      setEditRequest(null);
      fetchRequests();
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Update failed.");
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
      toast.success(`Request ${action === "accept" ? "verified" : "rejected"} successfully.`);
      fetchRequests();
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Action failed.");
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
      toast.success("Request status updated.");
      fetchRequests();
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
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Request deleted successfully.");
      setDeleteConfirm(null);
      fetchRequests();
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Delete failed.");
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
      {/* Create Request Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-105 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-slate-900 dark:text-white font-black text-lg">Create Emergency Blood Request</h3>
              <button 
                onClick={() => setCreateModalOpen(false)} 
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Patient Name</label>
                <input 
                  required 
                  type="text" 
                  value={createForm.patientName} 
                  onChange={(e) => setCreateForm({ ...createForm, patientName: e.target.value })} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Blood Type Required</label>
                  <select 
                    value={createForm.bloodType} 
                    onChange={(e) => setCreateForm({ ...createForm, bloodType: e.target.value })} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all"
                  >
                    {BLOOD_TYPES.map((t) => <option key={t} value={t} className="bg-white dark:bg-slate-950">{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Units Needed (1-20)</label>
                  <input 
                    required 
                    type="number" 
                    min="1" 
                    max="20" 
                    value={createForm.units} 
                    onChange={(e) => setCreateForm({ ...createForm, units: Number(e.target.value) })} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Hospital / Medical Center</label>
                <input 
                  required 
                  type="text" 
                  value={createForm.hospital} 
                  onChange={(e) => setCreateForm({ ...createForm, hospital: e.target.value })} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">City</label>
                  <select 
                    value={createForm.city} 
                    onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all"
                  >
                    {CITIES.map((c) => <option key={c} value={c} className="bg-white dark:bg-slate-950">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Urgency Level</label>
                  <select 
                    value={createForm.urgency} 
                    onChange={(e) => setCreateForm({ ...createForm, urgency: e.target.value as any })} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all"
                  >
                    <option value="normal" className="bg-white dark:bg-slate-955">Normal</option>
                    <option value="urgent" className="bg-white dark:bg-slate-955">Urgent</option>
                    <option value="critical" className="bg-white dark:bg-slate-955">Critical</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Contact Phone</label>
                  <input 
                    required 
                    type="text" 
                    value={createForm.contactPhone} 
                    onChange={(e) => setCreateForm({ ...createForm, contactPhone: e.target.value })} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Requested By (User ID)</label>
                  <input 
                    required 
                    type="text" 
                    value={createForm.requestedBy} 
                    onChange={(e) => setCreateForm({ ...createForm, requestedBy: e.target.value })} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white placeholder-slate-450 dark:placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all" 
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setCreateModalOpen(false)} 
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition focus:outline-none focus:ring-2 focus:ring-slate-500/50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading === "create"} 
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                >
                  {actionLoading === "create" ? "Creating..." : "Create Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Request Modal */}
      {editRequest && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-105 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-slate-900 dark:text-white font-black text-lg">Edit Blood Request Details</h3>
              <button 
                onClick={() => setEditRequest(null)} 
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Patient Name</label>
                <input 
                  required 
                  type="text" 
                  value={editForm.patientName} 
                  onChange={(e) => setEditForm({ ...editForm, patientName: e.target.value })} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Blood Type</label>
                  <select 
                    value={editForm.bloodType} 
                    onChange={(e) => setEditForm({ ...editForm, bloodType: e.target.value })} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all"
                  >
                    {BLOOD_TYPES.map((t) => <option key={t} value={t} className="bg-white dark:bg-slate-950">{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Units Required</label>
                  <input 
                    required 
                    type="number" 
                    min="1" 
                    max="20" 
                    value={editForm.units} 
                    onChange={(e) => setEditForm({ ...editForm, units: Number(e.target.value) })} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-550 transition-all" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Hospital / Medical Center</label>
                <input 
                  required 
                  type="text" 
                  value={editForm.hospital} 
                  onChange={(e) => setEditForm({ ...editForm, hospital: e.target.value })} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">City</label>
                  <select 
                    value={editForm.city} 
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-550 transition-all"
                  >
                    {CITIES.map((c) => <option key={c} value={c} className="bg-white dark:bg-slate-950">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Urgency Level</label>
                  <select 
                    value={editForm.urgency} 
                    onChange={(e) => setEditForm({ ...editForm, urgency: e.target.value as any })} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-550 transition-all"
                  >
                    <option value="normal" className="bg-white dark:bg-slate-955">Normal</option>
                    <option value="urgent" className="bg-white dark:bg-slate-955">Urgent</option>
                    <option value="critical" className="bg-white dark:bg-slate-955">Critical</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Contact Phone</label>
                  <input 
                    required 
                    type="text" 
                    value={editForm.contactPhone} 
                    onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-550 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Status</label>
                  <select 
                    value={editForm.status} 
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-550 transition-all"
                  >
                    <option value="open" className="bg-white dark:bg-slate-950">Open</option>
                    <option value="accepted" className="bg-white dark:bg-slate-950">Accepted</option>
                    <option value="rejected" className="bg-white dark:bg-slate-950">Rejected</option>
                    <option value="fulfilled" className="bg-white dark:bg-slate-950">Fulfilled</option>
                    <option value="cancelled" className="bg-white dark:bg-slate-950">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditRequest(null)} 
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
            <h3 className="text-slate-900 dark:text-white font-black text-center text-lg mb-2">Delete Request?</h3>
            <p className="text-slate-505 dark:text-slate-400 text-sm text-center mb-6">This action cannot be undone. The blood request will be permanently removed.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirm(null)} 
                className="flex-1 py-2.5 rounded-xl bg-slate-105 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition focus:outline-none focus:ring-2 focus:ring-slate-500/50"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(deleteConfirm)} 
                disabled={!!actionLoading} 
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                {actionLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Blood Requests</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{total} total requests</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCreateModalOpen(true)} 
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition shadow-lg shadow-red-600/10 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Request</span>
          </button>
          <button 
            onClick={fetchRequests} 
            disabled={loading} 
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-750 transition focus:outline-none focus:ring-2 focus:ring-red-500/50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-500" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-2xl p-4 flex flex-wrap gap-3 items-center shadow-2xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient, hospital or city..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold pl-10 pr-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-750 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select 
            value={filterStatus} 
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} 
            className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-250 dark:border-slate-750 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all capitalize"
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="bg-white dark:bg-slate-950">{s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select 
            value={filterBloodType} 
            onChange={(e) => { setFilterBloodType(e.target.value); setPage(1); }} 
            className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-250 dark:border-slate-750 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all"
          >
            <option value="all" className="bg-white dark:bg-slate-955">All Blood Types</option>
            {BLOOD_TYPES.map((bt) => <option key={bt} value={bt} className="bg-white dark:bg-slate-955">{bt}</option>)}
          </select>
          <select 
            value={filterCity} 
            onChange={(e) => { setFilterCity(e.target.value); setPage(1); }} 
            className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-250 dark:border-slate-750 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all"
          >
            <option value="all" className="bg-white dark:bg-slate-955">All Cities</option>
            {CITIES.map((c) => <option key={c} value={c} className="bg-white dark:bg-slate-955">{c}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 rounded-xl p-4 text-sm font-bold">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 flex items-center justify-center"><RefreshCw className="w-6 h-6 text-red-500 animate-spin" /></div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center"><Search className="w-10 h-10 text-slate-350 dark:text-slate-655 mx-auto mb-3" /><p className="text-slate-500 dark:text-slate-400 font-bold">No requests found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Patient / Request</th>
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Blood / Units</th>
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Hospital / City</th>
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Urgency</th>
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Status</th>
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Posted By</th>
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Flags</th>
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Date</th>
                  <th className="text-right text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850/80">
                {requests.map((req) => {
                  const postedBy = typeof req.requestedBy === "object" ? req.requestedBy : { name: "Unknown", city: "", email: "" };
                  const isActioning = actionLoading && actionLoading.startsWith(req._id);
                  return (
                    <tr key={req._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-black text-slate-900 dark:text-white text-xs">{req.patientName}</p>
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5 font-mono">
                          {req._id.slice(-8)} · {req.isVerified ? "✅ Verified" : "⏳ Unverified"}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-block bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 text-xs font-black px-2 py-0.5 rounded-lg">
                          {req.bloodType}
                        </span>
                        <p className="text-slate-500 dark:text-slate-450 text-[10px] mt-1 font-bold">{req.units} unit{req.units !== 1 ? "s" : ""}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-slate-700 dark:text-slate-350 text-xs font-bold">{req.hospital}</p>
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5">{req.city}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider ${urgencyColors[req.urgency] || ""}`}>
                          {req.urgency}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <select
                          value={req.status}
                          disabled={actionLoading === req._id + "status"}
                          onChange={(e) => handleStatusChange(req._id, e.target.value)}
                          className={`text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/50 ${statusColors[req.status] || ""}`}
                        >
                          {STATUS_OPTIONS.filter(s => s !== "all").map(s => (
                            <option key={s} value={s} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-slate-705 dark:text-slate-300 text-xs font-bold">{postedBy.name}</p>
                        <p className="text-slate-450 dark:text-slate-500 text-[10px] mt-0.5">{postedBy.city}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        {req.reports && req.reports > 0 ? (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900/40 text-[10px] font-black px-2 py-0.5 rounded-lg">
                            <AlertTriangle className="w-3 h-3" />
                            {req.reports}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-slate-500 dark:text-slate-500 text-[10px] font-mono">
                          {new Date(req.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {req.status === "open" && !req.isVerified && (
                            <>
                              <button
                                onClick={() => handleAction(req._id, "accept")}
                                disabled={!!isActioning}
                                title="Verify Request"
                                className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-all disabled:opacity-40 border border-emerald-200 dark:border-emerald-900/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                              >
                                {isActioning === req._id + "accept" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleAction(req._id, "reject")}
                                disabled={!!isActioning}
                                title="Reject Request"
                                className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-105 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center transition-all disabled:opacity-40 border border-red-200 dark:border-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                              >
                                {isActioning === req._id + "reject" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => openEditModal(req)}
                            disabled={!!isActioning}
                            title="Edit blood request"
                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-red-50 dark:bg-slate-800/40 dark:hover:bg-red-950/20 text-slate-450 hover:text-red-650 dark:text-slate-500 dark:hover:text-red-400 flex items-center justify-center transition-all disabled:opacity-40 border border-slate-200 hover:border-red-200 dark:border-slate-700 dark:hover:border-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(req._id)}
                            disabled={!!isActioning}
                            title="Delete Request"
                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-red-55 dark:bg-slate-800/40 dark:hover:bg-red-950/20 text-slate-455 hover:text-red-655 dark:text-slate-500 dark:hover:text-red-400 flex items-center justify-center transition-all disabled:opacity-40 border border-slate-200 hover:border-red-200 dark:border-slate-700 dark:hover:border-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500/50"
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
