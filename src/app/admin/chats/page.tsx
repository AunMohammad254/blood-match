"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { toast } from "sonner";
import {
  MessageSquare, RefreshCw, ChevronLeft, ChevronRight,
  Clock, ExternalLink, X, Search, Trash2, AlertTriangle
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
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const LIMIT = 20;

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
      toast.success("Chat history deleted successfully.");
      setDeleteConfirm(null);
      fetchChats();
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Delete failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-slate-900 dark:text-white font-black text-center text-lg mb-2">Delete Chat History?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-6">This will permanently remove this chat session log.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirm(null)} 
                className="flex-1 py-2.5 rounded-xl bg-slate-105 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition focus:outline-none focus:ring-2 focus:ring-slate-550/50"
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

      {/* Chat Detail Modal */}
      {selectedChat && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-slate-905 dark:text-white font-black text-lg">{selectedChat.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold">
                  User: {selectedChat.userId && typeof selectedChat.userId === 'object' ? selectedChat.userId.name : 'Deleted User'}
                </p>
              </div>
              <button
                onClick={() => setSelectedChat(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedChat.messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 text-sm font-medium ${
                    msg.role === 'user' 
                      ? 'bg-red-650 text-white shadow-xs' 
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-3xs'
                  }`}>
                    <p className="text-[10px] uppercase font-black mb-1 opacity-60">
                      {msg.role === 'user' ? 'User' : 'Assistant'}
                    </p>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-center rounded-b-2xl">
              <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-widest">
                End of Chat Log · {new Date(selectedChat.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-red-500" />
            AI Chat Monitoring
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review user interactions with BloodBot AI</p>
        </div>
        <button
          onClick={fetchChats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-750 transition focus:outline-none focus:ring-2 focus:ring-red-500/50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-550" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-955/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 rounded-xl p-4 text-sm font-bold">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-red-500 animate-spin" />
          </div>
        ) : chats.length === 0 ? (
          <div className="p-12 text-center">
            <Search className="w-10 h-10 text-slate-350 dark:text-slate-655 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-bold">No chat logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Session Title</th>
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">User</th>
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Messages</th>
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Last Activity</th>
                  <th className="text-right text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-105 dark:divide-slate-850/80">
                {chats.map((chat) => {
                  const user = chat.userId && typeof chat.userId === 'object' ? chat.userId : null;
                  return (
                    <tr key={chat._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-black text-slate-900 dark:text-white text-xs">{chat.title || "Untitled Session"}</p>
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5 font-mono">{chat._id.slice(-8)}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        {user ? (
                          <>
                            <p className="text-slate-705 dark:text-slate-300 text-xs font-bold">{user.name}</p>
                            <p className="text-slate-450 dark:text-slate-500 text-[10px] mt-0.5">{user.email}</p>
                          </>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-[10px] font-black border border-red-200 dark:border-red-900/40 uppercase tracking-wider">
                            Deleted User
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                          <MessageSquare className="w-3 h-3" />
                          {chat.messages.length}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-500 text-[10px] font-mono">
                          <Clock className="w-3 h-3 text-slate-400 dark:text-slate-600" />
                          {new Date(chat.updatedAt).toLocaleDateString()} {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedChat(chat)}
                            className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-450 flex items-center justify-center transition-all border border-red-200 dark:border-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(chat._id)}
                            disabled={!!actionLoading}
                            title="Delete chat history"
                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-red-50 dark:bg-slate-800/40 dark:hover:bg-red-950/20 text-slate-450 hover:text-red-650 dark:text-slate-500 dark:hover:text-red-400 flex items-center justify-center transition-all disabled:opacity-40 border border-slate-200 hover:border-red-200 dark:border-slate-700 dark:hover:border-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500/50"
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
