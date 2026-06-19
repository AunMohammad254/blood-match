"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { BLOOD_TYPES, CITIES } from "@/lib/constants";
import { toast } from "sonner";
import {
  Users, Trash2, RefreshCw, Filter, AlertTriangle,
  ChevronLeft, ChevronRight, Search, ToggleLeft, ToggleRight,
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
  donor: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/40",
  recipient: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/40",
  admin: "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/40",
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
      toast.success("User created successfully.");
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
      toast.error(err.message || "Create failed.");
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
      toast.success("User updated successfully.");
      setEditUser(null);
      fetchUsers();
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
      toast.success("Availability updated.");
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isAvailable: !current } : u));
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Update failed.");
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
      toast.success("User role updated.");
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, role: newRole } : u));
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
      toast.success("User deleted successfully.");
      setDeleteConfirm(null);
      fetchUsers();
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Delete failed.");
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
      {/* Create User Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-slate-900 dark:text-white font-black text-lg">Create New User</h3>
              <button 
                onClick={() => setCreateModalOpen(false)} 
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Full Name</label>
                <input 
                  required 
                  type="text" 
                  value={createForm.name} 
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Email</label>
                  <input 
                    required 
                    type="email" 
                    value={createForm.email} 
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Password</label>
                  <input 
                    required 
                    type="password" 
                    value={createForm.password} 
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Phone Number</label>
                  <input 
                    required 
                    type="text" 
                    value={createForm.phone} 
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Role</label>
                  <select 
                    value={createForm.role} 
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all"
                  >
                    <option value="donor" className="bg-white dark:bg-slate-950">Donor</option>
                    <option value="recipient" className="bg-white dark:bg-slate-950">Recipient</option>
                    <option value="admin" className="bg-white dark:bg-slate-950">Admin</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Blood Type</label>
                  <select 
                    value={createForm.bloodType} 
                    onChange={(e) => setCreateForm({ ...createForm, bloodType: e.target.value })} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all"
                  >
                    {BLOOD_TYPES.map((t) => <option key={t} value={t} className="bg-white dark:bg-slate-950">{t}</option>)}
                  </select>
                </div>
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
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="createAvailable" 
                  checked={createForm.isAvailable} 
                  onChange={(e) => setCreateForm({ ...createForm, isAvailable: e.target.checked })} 
                  className="rounded border-slate-300 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-red-600 focus:ring-2 focus:ring-red-500/50 focus:ring-offset-0 focus:outline-none h-4 w-4" 
                />
                <label htmlFor="createAvailable" className="text-xs font-bold text-slate-500 dark:text-slate-400 select-none">Available for donations (Donor status)</label>
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
                  {actionLoading === "create" ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-slate-900 dark:text-white font-black text-lg">Edit User Profile</h3>
              <button 
                onClick={() => setEditUser(null)} 
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Full Name</label>
                <input 
                  required 
                  type="text" 
                  value={editForm.name} 
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Role</label>
                  <select 
                    value={editForm.role} 
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all"
                  >
                    <option value="donor" className="bg-white dark:bg-slate-950">Donor</option>
                    <option value="recipient" className="bg-white dark:bg-slate-950">Recipient</option>
                    <option value="admin" className="bg-white dark:bg-slate-950">Admin</option>
                  </select>
                </div>
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
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">City</label>
                  <select 
                    value={editForm.city} 
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all"
                  >
                    {CITIES.map((c) => <option key={c} value={c} className="bg-white dark:bg-slate-950">{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="editAvailable" 
                  checked={editForm.isAvailable} 
                  onChange={(e) => setEditForm({ ...editForm, isAvailable: e.target.checked })} 
                  className="rounded border-slate-300 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-red-600 focus:ring-2 focus:ring-red-500/50 focus:ring-offset-0 focus:outline-none h-4 w-4" 
                />
                <label htmlFor="editAvailable" className="text-xs font-bold text-slate-500 dark:text-slate-400 select-none">Available for donations (Donor status)</label>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditUser(null)} 
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition focus:outline-none focus:ring-2 focus:ring-slate-500/50"
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
            <h3 className="text-slate-900 dark:text-white font-black text-center text-lg mb-2">Delete User?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-6">This will permanently remove the account and all associated data.</p>
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
                {actionLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">User Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{total} registered accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCreateModalOpen(true)} 
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition shadow-lg shadow-red-600/10 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create User</span>
          </button>
          <button 
            onClick={fetchUsers} 
            disabled={loading} 
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-750 transition focus:outline-none focus:ring-2 focus:ring-red-500/50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-500" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-4 flex flex-wrap gap-3 items-center shadow-2xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold pl-10 pr-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-750 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select 
            value={filterRole} 
            onChange={(e) => { setFilterRole(e.target.value); setPage(1); }} 
            className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-250 dark:border-slate-750 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all capitalize"
          >
            {ROLE_OPTIONS.map((r) => <option key={r} value={r} className="bg-white dark:bg-slate-950">{r === "all" ? "All Roles" : r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
          <select 
            value={filterBloodType} 
            onChange={(e) => { setFilterBloodType(e.target.value); setPage(1); }} 
            className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-250 dark:border-slate-750 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all"
          >
            <option value="all" className="bg-white dark:bg-slate-950">All Blood Types</option>
            {BLOOD_TYPES.map((bt) => <option key={bt} value={bt} className="bg-white dark:bg-slate-950">{bt}</option>)}
          </select>
          <select 
            value={filterCity} 
            onChange={(e) => { setFilterCity(e.target.value); setPage(1); }} 
            className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-250 dark:border-slate-750 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all"
          >
            <option value="all" className="bg-white dark:bg-slate-950">All Cities</option>
            {CITIES.map((c) => <option key={c} value={c} className="bg-white dark:bg-slate-950">{c}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 rounded-xl p-4 text-sm font-bold">{error}</div>}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 flex items-center justify-center"><RefreshCw className="w-6 h-6 text-red-500 animate-spin" /></div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center"><Search className="w-10 h-10 text-slate-350 dark:text-slate-650 mx-auto mb-3" /><p className="text-slate-500 dark:text-slate-400 font-bold">No users found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Name / Email</th>
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Role</th>
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Blood Type</th>
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">City</th>
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Phone</th>
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Available</th>
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Joined</th>
                  <th className="text-right text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850/80">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-black text-slate-900 dark:text-white text-xs">{user.name}</p>
                      <p className="text-slate-500 dark:text-slate-450 text-[10px] mt-0.5">{user.email}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <select
                        value={user.role}
                        disabled={actionLoading === user._id + "role"}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className={`text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/50 ${roleColors[user.role] || "bg-slate-100 text-slate-500 border-slate-200"}`}
                      >
                        {ROLE_OPTIONS.filter(r => r !== "all").map(r => (
                          <option key={r} value={r} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{r}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-block bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 text-xs font-black px-2 py-0.5 rounded-lg">
                        {user.bloodType}
                      </span>
                    </td>
                    <td className="px-4 py-3.5"><p className="text-slate-700 dark:text-slate-300 text-xs font-bold">{user.city}</p></td>
                    <td className="px-4 py-3.5"><p className="text-slate-600 dark:text-slate-400 text-xs font-mono">{user.phone}</p></td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => handleToggleAvailability(user._id, user.isAvailable)}
                        disabled={actionLoading === user._id + "toggle"}
                        title="Toggle availability"
                        className="flex items-center gap-1.5 transition-all disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded-lg p-0.5"
                      >
                        {user.isAvailable ? (
                          <ToggleRight className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-slate-400 dark:text-slate-650" />
                        )}
                        <span className={`text-[10px] font-bold ${user.isAvailable ? "text-emerald-500" : "text-slate-500"}`}>
                          {user.isAvailable ? "Yes" : "No"}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-slate-500 dark:text-slate-500 text-[10px] font-mono">
                        {new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(user)}
                          disabled={!!actionLoading}
                          title="Edit user details"
                          className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-red-50 dark:bg-slate-800/40 dark:hover:bg-red-950/20 text-slate-450 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 flex items-center justify-center transition-all disabled:opacity-40 border border-slate-200 hover:border-red-200 dark:border-slate-700 dark:hover:border-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(user._id)}
                          disabled={!!actionLoading}
                          title="Delete user"
                          className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-red-50 dark:bg-slate-800/40 dark:hover:bg-red-950/20 text-slate-455 hover:text-red-650 dark:text-slate-500 dark:hover:text-red-400 flex items-center justify-center transition-all disabled:opacity-40 border border-slate-200 hover:border-red-200 dark:border-slate-700 dark:hover:border-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500/50"
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
