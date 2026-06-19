"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import {
  MessageSquare, RefreshCw, ChevronLeft, ChevronRight,
  Clock, User, ExternalLink, X, Search, Trash2, AlertTriangle, CheckCircle
} from "lucide-react";

interface AdminChat {
  _id: string;
  userId: { _id: string; name: string; email: string } | null;
  title: string;
  messages: Array<{ role: string; content: string }>;
  updatedAt: string;
}

export default function AdminChatsPage() {
  const router = useRouter();
  const [chats, setChats] = useState<AdminChat[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [selectedChat, setSelectedChat] = useState<AdminChat | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const LIMIT = 20;

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchChats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/chats?page=${page}&limit=${LIMIT}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setChats(data.chats || []);
      setTotal(data.total || 0);
    } catch {
      setError("Failed to load chat logs.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchChats(); }, [fetchChats]);

  const handleDelete = async (id: string) => {
    setActionLoading(id + "delete");
    try {
      const res = await fetch(`/api/admin/chats/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      showToast("Chat history deleted.", "success");
      setDeleteConfirm(null);
      fetchChats();
      router.refresh();
    } catch (e: any) {
      showToast(e.message || "Delete failed.", "error");
    } finally {
      setActionLoading(null);
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

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-white font-black text-center text-lg mb-2">Delete Chat History?</h3>
            <p className="text-gray-400 text-sm text-center mb-6">This will permanently remove this chat session log.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 font-bold text-sm hover:bg-gray-700 transition">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={!!actionLoading} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition disabled:opacity-50">
                {actionLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Detail Modal */}
      {selectedChat && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-white font-black text-lg">{selectedChat.title}</h3>
                <p className="text-gray-500 text-xs font-bold">
                  User: {selectedChat.userId && typeof selectedChat.userId === 'object' ? selectedChat.userId.name : 'Deleted User'}
                </p>
              </div>
              <button
                onClick={() => setSelectedChat(null)}
                className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedChat.messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 text-sm font-medium ${
                    msg.role === 'user' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-800 text-gray-200 border border-gray-700'
                  }`}>
                    <p className="text-[10px] uppercase font-black mb-1 opacity-60">
                      {msg.role === 'user' ? 'User' : 'Assistant'}
                    </p>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-800 bg-gray-800/20 text-center">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                End of Chat Log · {new Date(selectedChat.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-red-500" />
            AI Chat Monitoring
          </h1>
          <p className="text-sm text-gray-500 mt-1">Review user interactions with BloodBot AI</p>
        </div>
        <button
          onClick={fetchChats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold border border-gray-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-400" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800/50 text-red-300 rounded-xl p-4 text-sm font-bold">{error}</div>
      )}

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-red-500 animate-spin" />
          </div>
        ) : chats.length === 0 ? (
          <div className="p-12 text-center">
            <Search className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 font-bold">No chat logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">Session Title</th>
                  <th className="text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">User</th>
                  <th className="text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">Messages</th>
                  <th className="text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">Last Activity</th>
                  <th className="text-right text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {chats.map((chat) => {
                  const user = chat.userId && typeof chat.userId === 'object' ? chat.userId : null;
                  return (
                    <tr key={chat._id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-black text-white text-xs">{chat.title || "Untitled Session"}</p>
                        <p className="text-gray-600 text-[10px] mt-0.5 font-mono">{chat._id.slice(-8)}</p>
                      </td>
                      <td className="px-4 py-3">
                        {user ? (
                          <>
                            <p className="text-gray-300 text-xs font-bold">{user.name}</p>
                            <p className="text-gray-600 text-[10px] mt-0.5">{user.email}</p>
                          </>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-red-950/40 text-red-400 text-[10px] font-black border border-red-900/50 uppercase tracking-wider">
                            Deleted User
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-gray-800 text-gray-400 text-[10px] font-bold border border-gray-700">
                          <MessageSquare className="w-3 h-3" />
                          {chat.messages.length}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-gray-500 text-[10px] font-mono">
                          <Clock className="w-3 h-3" />
                          {new Date(chat.updatedAt).toLocaleDateString()} {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedChat(chat)}
                            className="w-8 h-8 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 flex items-center justify-center transition-all border border-red-500/30 hover:border-red-500/60"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(chat._id)}
                            disabled={!!actionLoading}
                            title="Delete chat history"
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
