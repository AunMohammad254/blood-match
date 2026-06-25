"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { getUser, logout } from "@/lib/auth";
import { User } from "@/types";
import { Menu, X, User as UserIcon, LayoutDashboard, LogOut, Radar as RadarIcon } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";

export const Navbar: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const checkUser = () => {
    setUser(getUser());
  };

  useEffect(() => {
    checkUser();
  }, [pathname]);

  useEffect(() => {
    window.addEventListener("storage", checkUser);
    return () => window.removeEventListener("storage", checkUser);
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800/80 shadow-xs transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between relative">
        
        {/* Subtle Ambient Brand Glow */}
        <div className="absolute -top-10 left-10 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />

        <Link href="/" className="flex items-center gap-3 font-black text-2xl text-gray-900 dark:text-white group z-10">
          <div className="w-11 h-11 rounded-2xl shadow-md group-hover:scale-105 group-hover:rotate-6 transition-all duration-300 overflow-hidden bg-gray-900 dark:bg-slate-950 flex items-center justify-center border border-gray-800 dark:border-slate-700">
            <Image src="/logo.png" alt="BloodMatch Logo" width={44} height={44} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="tracking-tight leading-none text-xl md:text-2xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-red-950 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">BloodMatch</span>
            <span className="text-[10px] font-extrabold text-red-600 uppercase tracking-widest mt-0.5">Emergency Triage</span>
          </div>
        </Link>

        {/* Desktop Premium Navigation */}
        <div className="hidden md:flex items-center gap-3 lg:gap-4 z-10">
          <Link
            href="/radar"
            className="text-gray-700 dark:text-slate-350 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-950/20 border border-transparent hover:border-red-100 dark:hover:border-red-900/30 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 shadow-xs"
          >
            <RadarIcon className="w-4 h-4 text-red-600 animate-pulse" />
            <span>Tactical Radar</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-2 text-xs text-red-950 dark:text-rose-200 bg-gradient-to-r from-red-50 via-rose-50 to-white dark:from-slate-800 dark:to-slate-900 border border-red-200/80 dark:border-slate-700/80 px-4 py-2 rounded-2xl shadow-xs font-bold hover:border-red-300 dark:hover:border-slate-600 hover:shadow-sm transition-all group"
              >
                <UserIcon className="w-4 h-4 text-red-600 shrink-0 group-hover:scale-110 transition-transform" />
                <span>Hello, <strong className="font-black text-red-700 dark:text-red-400">{user.name}</strong></span>
                <span className="bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">{user.role}</span>
              </Link>

              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-red-500/20"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Admin Panel</span>
                </Link>
              )}

              <Link
                href="/dashboard"
                className="bg-gray-900 dark:bg-slate-800 hover:bg-gray-800 dark:hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm hover:shadow"
              >
                <LayoutDashboard className="w-4 h-4 text-red-400" />
                <span>Dashboard</span>
              </Link>

              <button
                onClick={handleLogout}
                className="bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-slate-700 text-red-600 dark:text-red-400 border border-red-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-slate-650 font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 border border-gray-200 dark:border-slate-700 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-xs"
              >
                Login
              </Link>
              <Link
                href="/register?role=donor"
                className="btn-primary py-2.5"
              >
                <span>Become a Donor</span>
              </Link>
            </div>
          )}

          <ThemeToggle />
        </div>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center gap-2.5 z-20">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-11 h-11 rounded-2xl bg-gray-105 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white flex items-center justify-center focus:outline-none transition-colors border border-gray-200/10"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-red-600" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-b border-gray-100 dark:border-slate-800 px-6 py-8 space-y-4 animate-fadeIn shadow-2xl">
          <Link
            href="/radar"
            onClick={() => setMobileMenuOpen(false)}
            className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-900 dark:text-red-300 hover:bg-red-100 px-4 py-3 rounded-2xl font-black text-sm flex items-center gap-3 shadow-xs"
          >
            <RadarIcon className="w-5 h-5 text-red-600 animate-pulse" />
            <span>Tactical Emergency Radar</span>
          </Link>

          {user ? (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700 dark:text-slate-300">Notifications</span>
                <NotificationBell />
              </div>
              <Link
                href="/dashboard/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-red-50 to-gray-50 dark:from-slate-800 dark:to-slate-850 border border-red-100 dark:border-slate-700 rounded-2xl text-xs text-gray-800 dark:text-slate-200 hover:border-red-300 transition-all"
              >
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-red-600" />
                  <span>Hello, <strong className="font-extrabold text-gray-900 dark:text-white">{user.name}</strong></span>
                </div>
                <span className="bg-red-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase">{user.role}</span>
              </Link>

              {user.role === "admin" && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-red-600 text-white hover:bg-red-700 px-4 py-3.5 rounded-2xl font-black text-sm flex items-center gap-3 shadow-lg shadow-red-500/20"
                >
                  <UserIcon className="w-5 h-5" />
                  <span>Admin Command Center</span>
                </Link>
              )}

              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-gray-900 dark:bg-slate-800 text-white hover:bg-gray-800 dark:hover:bg-slate-705 px-4 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-3 shadow-md"
              >
                <LayoutDashboard className="w-5 h-5 text-red-400" />
                <span>Dashboard Home</span>
              </Link>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left text-red-600 dark:text-red-400 font-extrabold px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-slate-700 text-sm flex items-center gap-3 border border-red-200 dark:border-slate-700 shadow-xs"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center border-2 border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-800 dark:text-slate-200 font-extrabold py-3.5 rounded-2xl text-sm transition"
              >
                Login to Dashboard
              </Link>
              <Link
                href="/register?role=donor"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center bg-red-600 text-white font-extrabold py-3.5 rounded-2xl text-sm shadow-lg shadow-red-500/30 transition"
              >
                Register as Blood Donor
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
