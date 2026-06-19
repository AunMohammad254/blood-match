"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { BLOOD_TYPES, CITIES } from "@/lib/constants";
import {
  Users, Trash2, RefreshCw, Filter, AlertTriangle,
  ChevronLeft, ChevronRight, Search, ToggleLeft, ToggleRight, CheckCircle,
  Plus, Pencil, X
} from "lucide-react";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  bloodType: string;
  city: string;
  isAvailable: boolean;
  createdAt: string;
}

const ROLE_OPTIONS = ["all", "donor", "recipient", "admin"];

const roleColors: Record<string, string> = {
  donor: "bg-red-500/20 text-red-400 border-red-500/40",
  recipient: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  admin: "bg-purple-500/20 text-purple-400 border-purple-500/40",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterBloodType, setFilterBloodType] = useState("all");
  const [filterCity, setFilterCity] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  
  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  
  // Forms state
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    bloodType: "A+",
    city: "Karachi",
    role: "donor",
    isAvailable: true,
  });

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    bloodType: "",
    city: "",
    role: "",
    isAvailable: true,
  });

  const LIMIT = 20;

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        role: filterRole,
        bloodType: filterBloodType,
        city: filterCity === "all" ? "" : filterCity,
        search: search,
      });
      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [page, filterRole, filterBloodType, filterCity, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("create");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      showToast("User created successfully.", "success");
      setCreateModalOpen(false);
      setCreateForm({
        name: "",
        email: "",
        password: "",
        phone: "",
        bloodType: "A+",
        city: "Karachi",
        role: "donor",
        isAvailable: true,
      });
      fetchUsers();
      router.refresh();
    } catch (err: any) {
      showToast(err.message || "Create failed.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setActionLoading("edit");
    try {
      const updatePayload: Record<string, any> = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        city: editForm.city,
        bloodType: editForm.bloodType,
        role: editForm.role,
        isAvailable: editForm.isAvailable,
      };
      if (editForm.password) updatePayload.password = editForm.password;

      const res = await fetch(`/api/admin/users/${editUser._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(updatePayload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      showToast("User updated successfully.", "success");
      setEditUser(null);
      fetchUsers();
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
      showToast("Availability updated.", "success");
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isAvailable: !current } : u));
      router.refresh();
    } catch (e: any) {
      showToast(e.message || "Update failed.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    setActionLoading(id + "role");
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("User role updated.", "success");
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, role: newRole } : u));
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
      showToast("User deleted.", "success");
      setDeleteConfirm(null);
      fetchUsers();
      router.refresh();
    } catch (e: any) {
      showToast(e.message || "Delete failed.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (user: AdminUser) => {
    setEditUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      bloodType: user.bloodType,
      role: user.role,
      isAvailable: user.isAvailable,
      password: "", // empty means no change
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

      {/* Create User Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col my-8">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-white font-black text-lg">Create New User</h3>
              <button onClick={() => setCreateModalOpen(false)} className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Full Name</label>
                <input required type="text" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Email</label>
                  <input required type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Password</label>
                  <input required type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Phone Number</label>
                  <input required type="text" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Role</label>
                  <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500">
                    <option value="donor">Donor</option>
                    <option value="recipient">Recipient</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Blood Type</label>
                  <select value={createForm.bloodType} onChange={(e) => setCreateForm({ ...createForm, bloodType: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500">
                    {BLOOD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">City</label>
                  <select value={createForm.city} onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500">
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="createAvailable" checked={createForm.isAvailable} onChange={(e) => setCreateForm({ ...createForm, isAvailable: e.target.checked })} className="rounded border-gray-700 bg-gray-800 text-red-600 focus:ring-0 focus:ring-offset-0" />
                <label htmlFor="createAvailable" className="text-xs font-bold text-gray-400 select-none">Available for donations (Donor status)</label>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setCreateModalOpen(false)} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 font-bold text-xs hover:bg-gray-700 transition">Cancel</button>
                <button type="submit" disabled={actionLoading === "create"} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition disabled:opacity-50">
                  {actionLoading === "create" ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col my-8">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-white font-black text-lg">Edit User Profile</h3>
              <button onClick={() => setEditUser(null)} className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Full Name</label>
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
                  <label className="block text-xs font-bold text-gray-400 mb-1">Role</label>
                  <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500">
                    <option value="donor">Donor</option>
                    <option value="recipient">Recipient</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Blood Type</label>
                  <select value={editForm.bloodType} onChange={(e) => setEditForm({ ...editForm, bloodType: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500">
                    {BLOOD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">City</label>
                  <select value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500">
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="editAvailable" checked={editForm.isAvailable} onChange={(e) => setEditForm({ ...editForm, isAvailable: e.target.checked })} className="rounded border-gray-700 bg-gray-800 text-red-600 focus:ring-0 focus:ring-offset-0" />
                <label htmlFor="editAvailable" className="text-xs font-bold text-gray-400 select-none">Available for donations (Donor status)</label>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setEditUser(null)} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 font-bold text-xs hover:bg-gray-700 transition">Cancel</button>
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
            <h3 className="text-white font-black text-center text-lg mb-2">Delete User?</h3>
            <p className="text-gray-400 text-sm text-center mb-6">This will permanently remove the account and all associated data.</p>
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
          <h1 className="text-2xl font-black text-white">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">{total} registered accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition shadow-lg shadow-red-600/10">
            <Plus className="w-3.5 h-3.5" />
            <span>Create User</span>
          </button>
          <button onClick={fetchUsers} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold border border-gray-700 transition">
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
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-gray-800 text-white text-xs font-bold pl-10 pr-4 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-red-500 transition-all"
          />
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setPage(1); }} className="bg-gray-800 text-white text-xs font-bold px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-red-500 capitalize">
            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r === "all" ? "All Roles" : r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
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
        ) : users.length === 0 ? (
          <div className="p-12 text-center"><Search className="w-10 h-10 text-gray-700 mx-auto mb-3" /><p className="text-gray-500 font-bold">No users found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">Name / Email</th>
                  <th className="text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">Role</th>
                  <th className="text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">Blood Type</th>
                  <th className="text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">City</th>
                  <th className="text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">Phone</th>
                  <th className="text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">Available</th>
                  <th className="text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">Joined</th>
                  <th className="text-right text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-black text-white text-xs">{user.name}</p>
                      <p className="text-gray-600 text-[10px] mt-0.5">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        disabled={actionLoading === user._id + "role"}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className={`text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider bg-transparent cursor-pointer focus:outline-none ${roleColors[user.role] || "bg-gray-700/20 text-gray-400 border-gray-700"}`}
                      >
                        {ROLE_OPTIONS.filter(r => r !== "all").map(r => (
                          <option key={r} value={r} className="bg-gray-900 text-white">{r}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-black px-2 py-0.5 rounded-lg">
                        {user.bloodType}
                      </span>
                    </td>
                    <td className="px-4 py-3"><p className="text-gray-300 text-xs font-bold">{user.city}</p></td>
                    <td className="px-4 py-3"><p className="text-gray-400 text-xs font-mono">{user.phone}</p></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleAvailability(user._id, user.isAvailable)}
                        disabled={actionLoading === user._id + "toggle"}
                        title="Toggle availability"
                        className="flex items-center gap-1.5 transition-all disabled:opacity-40"
                      >
                        {user.isAvailable ? (
                          <ToggleRight className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-600" />
                        )}
                        <span className={`text-[10px] font-bold ${user.isAvailable ? "text-emerald-500" : "text-gray-600"}`}>
                          {user.isAvailable ? "Yes" : "No"}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-500 text-[10px] font-mono">
                        {new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(user)}
                          disabled={!!actionLoading}
                          title="Edit user details"
                          className="w-8 h-8 rounded-lg bg-gray-700/40 hover:bg-red-600/20 text-gray-500 hover:text-red-400 flex items-center justify-center transition-all disabled:opacity-40 border border-gray-700 hover:border-red-500/30"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(user._id)}
                          disabled={!!actionLoading}
                          title="Delete user"
                          className="w-8 h-8 rounded-lg bg-gray-700/40 hover:bg-red-600/20 text-gray-500 hover:text-red-400 flex items-center justify-center transition-all disabled:opacity-40 border border-gray-700 hover:border-red-500/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
