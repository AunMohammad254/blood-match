"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { getUser, logout } from "@/lib/auth";
import { User } from "@/types";
import { Menu, X, User as UserIcon, LayoutDashboard, LogOut, Radar as RadarIcon } from "lucide-react";

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
    window.addEventListener("storage", checkUser);
    return () => window.removeEventListener("storage", checkUser);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    setUser(null);
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-xs transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between relative">
        
        {/* Subtle Ambient Brand Glow */}
        <div className="absolute -top-10 left-10 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />

        <Link href="/" className="flex items-center gap-3 font-black text-2xl text-gray-900 group z-10">
          <div className="w-11 h-11 rounded-2xl shadow-md group-hover:scale-105 group-hover:rotate-6 transition-all duration-300 overflow-hidden bg-gray-900 flex items-center justify-center border border-gray-800">
            <Image src="/logo.png" alt="BloodMatch Logo" width={44} height={44} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="tracking-tight leading-none text-xl md:text-2xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-red-950 bg-clip-text text-transparent">BloodMatch</span>
            <span className="text-[10px] font-extrabold text-red-600 uppercase tracking-widest mt-0.5">Emergency Triage</span>
          </div>
        </Link>

        {/* Desktop Premium Navigation */}
        <div className="hidden md:flex items-center gap-3 lg:gap-4 z-10">
          <Link
            href="/radar"
            className="text-gray-700 hover:text-red-600 hover:bg-red-50/80 border border-transparent hover:border-red-100 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 shadow-xs"
          >
            <RadarIcon className="w-4 h-4 text-red-600 animate-pulse" />
            <span>Tactical Radar</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-2 text-xs text-red-950 bg-gradient-to-r from-red-50 via-rose-50 to-white border border-red-200/80 px-4 py-2 rounded-2xl shadow-xs font-bold hover:border-red-300 hover:shadow-sm transition-all group"
              >
                <UserIcon className="w-4 h-4 text-red-600 shrink-0 group-hover:scale-110 transition-transform" />
                <span>Hello, <strong className="font-black text-red-700">{user.name}</strong></span>
                <span className="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">{user.role}</span>
              </Link>

              <Link
                href="/dashboard"
                className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm hover:shadow"
              >
                <LayoutDashboard className="w-4 h-4 text-red-400" />
                <span>Dashboard</span>
              </Link>

              <button
                onClick={handleLogout}
                className="bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-xs"
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
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden w-12 h-12 rounded-2xl bg-gray-100 text-gray-700 hover:text-gray-900 flex items-center justify-center focus:outline-none transition-colors z-20"
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6 text-red-600" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-2xl border-b border-gray-100 px-6 py-8 space-y-4 animate-fadeIn shadow-2xl">
          <Link
            href="/radar"
            onClick={() => setMobileMenuOpen(false)}
            className="bg-red-50 border border-red-200 text-red-900 hover:bg-red-100 px-4 py-3 rounded-2xl font-black text-sm flex items-center gap-3 shadow-xs"
          >
            <RadarIcon className="w-5 h-5 text-red-600 animate-pulse" />
            <span>Tactical Emergency Radar</span>
          </Link>

          {user ? (
            <div className="space-y-4 pt-2">
              <Link
                href="/dashboard/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-red-50 to-gray-50 border border-red-100 rounded-2xl text-xs text-gray-800 hover:border-red-300 transition-all"
              >
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-red-600" />
                  <span>Hello, <strong className="font-extrabold text-gray-900">{user.name}</strong></span>
                </div>
                <span className="bg-red-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase">{user.role}</span>
              </Link>

              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-gray-900 text-white hover:bg-gray-800 px-4 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-3 shadow-md"
              >
                <LayoutDashboard className="w-5 h-5 text-red-400" />
                <span>Dashboard Home</span>
              </Link>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left text-red-600 font-extrabold px-4 py-3 rounded-2xl bg-white hover:bg-red-50 text-sm flex items-center gap-3 border border-red-200 shadow-xs"
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
                className="w-full text-center border-2 border-gray-300 hover:bg-gray-50 text-gray-800 font-extrabold py-3.5 rounded-2xl text-sm transition"
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
