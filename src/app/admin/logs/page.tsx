"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getToken } from "@/lib/auth";
import {
  ShieldAlert, RefreshCw, ChevronLeft, ChevronRight,
  Clock, Search, ShieldCheck
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
          <h1 className="text-2xl font-black text-slate-905 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-red-500" />
            AI Rate-Limit Logs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monitor API hits to Google Gemini model for rate limit tracking</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-750 transition focus:outline-none focus:ring-2 focus:ring-red-500/50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-500" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Search Filter */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-2xl p-4 flex flex-wrap gap-3 items-center shadow-2xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by IP address or AI model..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold pl-10 pr-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-750 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>
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
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-bold">No hit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-855 bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">IP Address</th>
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Model Requested</th>
                  <th className="text-left text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-wider px-4 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-105 dark:divide-slate-850/80">
                {logs.map((log, index) => (
                  <tr key={log._id || index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-black text-slate-900 dark:text-white text-xs font-mono">{log.ip}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-[10px] font-black border border-red-200 dark:border-red-900/40 uppercase tracking-wider">
                        {log.modelName}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-550 dark:text-slate-450 text-[10px] font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
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
          <p className="text-xs text-slate-500 dark:text-slate-450 font-bold">Page {page} of {totalPages} · {total} total logs</p>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage((p) => Math.max(1, p - 1))} 
              disabled={page <= 1} 
              className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-605 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 flex items-center justify-center transition focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))} 
              disabled={page >= totalPages} 
              className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-605 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 flex items-center justify-center transition focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
