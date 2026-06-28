"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { getUser, logout, isLoggedIn, getToken } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  ShieldAlert,
  Menu,
  X,
  Activity,
  HeartHandshake,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { logger } from "@/lib/logger";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/requests", label: "Requests", icon: FileText, exact: false },
  { href: "/admin/users", label: "Users", icon: Users, exact: false },
  { href: "/admin/donors", label: "Donors", icon: HeartHandshake, exact: false },
  { href: "/admin/chats", label: "AI Chats", icon: Activity, exact: false },
  { href: "/admin/logs", label: "AI Logs", icon: ShieldAlert, exact: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const verifyAdmin = async () => {
      if (!isLoggedIn()) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${getToken()}` },
        });

        if (!res.ok) {
          logout();
          router.push("/login");
          return;
        }

        const data = await res.json();
        if (data.user.role !== "admin" && data.user.role !== "coordinator") {
          router.push("/dashboard");
          return;
        }

        setAuthorized(true);
      } catch (err: any) {
        logger.error("Auth verification failed", err);
        router.push("/login");
      }
    };

    verifyAdmin();
  }, [router]);

  if (!authorized) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-500">Verifying admin session...</p>
      </div>
    );
  }

  const user = getUser();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isActive = (item: typeof NAV_ITEMS[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href) && pathname !== "/admin";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex transition-colors duration-200">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-20 left-0 h-[calc(100vh-5rem)] w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-850 z-40 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-950 flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0">
            <Image src="/logo.png" alt="Logo" width={36} height={36} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-slate-900 dark:text-white font-black text-sm tracking-tight leading-none">BloodMatch</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <ShieldAlert className="w-3 h-3 text-red-500" />
              <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-widest">Admin Panel</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  active
                    ? "bg-red-50 dark:bg-red-600/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-red-600 dark:text-red-400" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info & logout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-850">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-slate-900 dark:text-white text-xs font-black truncate">{user?.name}</p>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                {user?.role === "admin" ? "Super Admin" : "Coordinator"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 md:ml-64 flex flex-col min-h-[calc(100vh-5rem)]">
        {/* Top bar */}
        <header className="sticky top-20 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 px-4 h-14 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest hidden sm:block">
                Admin Control Center
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-500 animate-pulse" />
              <span className="text-xs font-black text-slate-700 dark:text-slate-350 hidden sm:block">BloodMatch Command</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 animate-fadeIn">
          {children}
        </main>
      </div>
    </div>
  );
}
