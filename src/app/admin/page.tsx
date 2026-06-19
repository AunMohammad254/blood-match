"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getToken } from "@/lib/auth";
import { AdminStats } from "@/types";
import {
  Users, FileText, CheckCircle, XCircle, Activity,
  HeartHandshake, TrendingUp, AlertTriangle, Clock, RefreshCw,
  ArrowRight, MessageSquare,
} from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  sub?: string;
}

function StatCard({ label, value, icon: Icon, color, sub }: StatCardProps) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-start gap-4 hover:border-gray-700 transition-all`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-black text-white">{value}</p>
        <p className="text-xs font-bold text-gray-400 mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-gray-600 mt-0.5 font-medium">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Failed to load stats");
      const data = await res.json();
      setStats(data);
    } catch {
      setError("Failed to load dashboard stats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Platform-wide operational overview</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition-all border border-gray-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-400" : ""}`} />
          <span>{loading ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800/50 text-red-300 rounded-xl p-4 text-sm font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      )}

      {stats && (
        <>
          {/* User Stats */}
          <div>
            <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-3">Users</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Users" value={stats.totalUsers} icon={Users} color="bg-blue-600" />
              <StatCard label="Blood Donors" value={stats.totalDonors} icon={HeartHandshake} color="bg-red-600" />
              <StatCard label="Recipients" value={stats.totalRecipients} icon={Activity} color="bg-purple-600" />
              <StatCard
                label="New (7 days)"
                value={stats.newUsersLast7Days}
                icon={TrendingUp}
                color="bg-emerald-600"
                sub="Recently registered"
              />
            </div>
          </div>

          {/* Request Stats */}
          <div>
            <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-3">Blood Requests</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard label="Total Requests" value={stats.totalRequests} icon={FileText} color="bg-gray-700" />
              <StatCard label="Open" value={stats.openRequests} icon={Clock} color="bg-yellow-600" />
              <StatCard label="Accepted" value={stats.acceptedRequests} icon={CheckCircle} color="bg-emerald-600" />
              <StatCard label="Rejected" value={stats.rejectedRequests} icon={XCircle} color="bg-red-700" />
              <StatCard label="Critical" value={stats.criticalRequests} icon={AlertTriangle} color="bg-orange-600" />
            </div>
          </div>

          {/* AI Chat Bot Metrics */}
          <div>
            <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-3">AI Chat Bot Metrics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Chat Sessions" value={stats.totalChats || 0} icon={MessageSquare} color="bg-indigo-600" />
              <StatCard label="Total AI Messages" value={stats.totalChatMessages || 0} icon={FileText} color="bg-pink-600" />
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-3">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/admin/requests?status=open"
                className="flex items-center justify-between p-5 bg-gray-900 border border-yellow-500/30 hover:border-yellow-500/60 rounded-2xl transition-all group"
              >
                <div>
                  <p className="text-white font-black text-sm">Review Open Requests</p>
                  <p className="text-yellow-500 text-xs font-bold mt-1">{stats.openRequests} awaiting review</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-yellow-500 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/admin/users"
                className="flex items-center justify-between p-5 bg-gray-900 border border-blue-500/30 hover:border-blue-500/60 rounded-2xl transition-all group"
              >
                <div>
                  <p className="text-white font-black text-sm">Manage Users</p>
                  <p className="text-blue-400 text-xs font-bold mt-1">{stats.totalUsers} registered accounts</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/admin/donors"
                className="flex items-center justify-between p-5 bg-gray-900 border border-red-500/30 hover:border-red-500/60 rounded-2xl transition-all group"
              >
                <div>
                  <p className="text-white font-black text-sm">Donor Registry</p>
                  <p className="text-red-400 text-xs font-bold mt-1">{stats.totalDonors} active donors</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-4">Request Status Breakdown</h2>
              <div className="space-y-3">
                {[
                  { label: "Open", count: stats.openRequests, color: "bg-yellow-500", total: stats.totalRequests },
                  { label: "Accepted", count: stats.acceptedRequests, color: "bg-emerald-500", total: stats.totalRequests },
                  { label: "Rejected", count: stats.rejectedRequests, color: "bg-red-500", total: stats.totalRequests },
                  { label: "Fulfilled", count: stats.fulfilledRequests, color: "bg-blue-500", total: stats.totalRequests },
                  { label: "Cancelled", count: stats.cancelledRequests, color: "bg-gray-500", total: stats.totalRequests },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-20 flex-shrink-0">{item.label}</span>
                    <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${item.color}`}
                        style={{ width: item.total ? `${(item.count / item.total) * 100}%` : "0%" }}
                      />
                    </div>
                    <span className="text-xs font-black text-white w-6 text-right">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-4">Top Requesting Cities</h2>
              <div className="space-y-3">
                {stats.cityBreakdown?.map((city) => (
                  <div key={city._id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                    <span className="text-xs font-bold text-gray-300">{city._id || "Unknown"}</span>
                    <span className="text-xs font-black text-white bg-gray-800 px-2 py-0.5 rounded-lg">{city.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-4">Blood Type Distribution</h2>
            <div className="flex flex-wrap gap-4">
              {stats.bloodTypeDistribution?.map((bt) => (
                <div key={bt._id} className="flex-1 min-w-[100px] bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 text-center">
                  <p className="text-red-500 text-lg font-black">{bt._id || "N/A"}</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">{bt.count} users</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent AI Chats */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">Recent AI Chat Sessions</h2>
              <Link href="/admin/chats" className="text-xs font-bold text-red-500 hover:text-red-400 flex items-center gap-1 group">
                <span>View all logs</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
            {(!stats.recentChats || stats.recentChats.length === 0) ? (
              <p className="text-gray-500 text-xs font-bold py-2">No recent AI chats found.</p>
            ) : (
              <div className="space-y-3">
                {stats.recentChats.map((chat) => {
                  const user = chat.userId && typeof chat.userId === 'object' ? chat.userId : null;
                  return (
                    <div key={chat._id} className="flex flex-wrap items-center justify-between p-4 bg-gray-800/40 border border-gray-700/40 rounded-xl hover:border-gray-600 transition-all">
                      <div className="space-y-1">
                        <p className="text-white font-bold text-sm">{chat.title || "Untitled Session"}</p>
                        <p className="text-xs text-gray-400">
                          User: <span className="text-gray-300 font-bold">{user ? user.name : "Deleted User"}</span>
                          {user && <span className="text-gray-500"> ({user.email})</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 mt-2 sm:mt-0">
                        <span className="text-xs font-bold text-gray-500 bg-gray-800 px-2 py-0.5 rounded-lg">
                          {chat.messages?.length || 0} messages
                        </span>
                        <span className="text-[10px] text-gray-600 font-mono">
                          {new Date(chat.updatedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
