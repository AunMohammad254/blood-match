"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getToken } from "@/lib/auth";
import {
  ShieldAlert, RefreshCw, ChevronLeft, ChevronRight,
  Clock, Search, AlertTriangle, ShieldCheck
} from "lucide-react";

interface AdminLog {
  _id?: string;
  ip: string;
  modelName: string;
  timestamp: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const LIMIT = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        search: search,
      });
      const res = await fetch(`/api/admin/logs?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch {
      setError("Failed to load operational logs.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-red-500" />
            AI Rate-Limit Logs
          </h1>
          <p className="text-sm text-gray-500 mt-1">Monitor API hits to Google Gemini model for rate limit tracking</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold border border-gray-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-400" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Search Filter */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by IP address or AI model..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-gray-800 text-white text-xs font-bold pl-10 pr-4 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-red-500 transition-all"
          />
        </div>
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
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="w-10 h-10 text-emerald-500/80 mx-auto mb-3" />
            <p className="text-gray-500 font-bold">No hit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">IP Address</th>
                  <th className="text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">Model Requested</th>
                  <th className="text-left text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {logs.map((log, index) => (
                  <tr key={log._id || index} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-black text-white text-xs font-mono">{log.ip}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-red-600/20 text-red-400 text-[10px] font-black border border-red-500/30 uppercase tracking-wider">
                        {log.modelName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-mono">
                        <Clock className="w-3.5 h-3.5 text-gray-600" />
                        {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}
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
          <p className="text-xs text-gray-500 font-bold">Page {page} of {totalPages} · {total} total logs</p>
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
