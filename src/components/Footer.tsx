"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Heart, ShieldCheck, Sparkles, PhoneCall } from "lucide-react";

export const Footer: React.FC = () => {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 py-16 mt-auto">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-12 gap-10 items-center justify-between">
        
        {/* Brand Brand Identity */}
        <div className="md:col-span-5 flex flex-col items-center md:items-start gap-3">
          <Link href="/" className="flex items-center gap-3 font-black text-xl text-gray-900 dark:text-white">
            <div className="w-9 h-9 rounded-xl shadow-xs overflow-hidden bg-gray-900 flex items-center justify-center border border-gray-800 dark:border-slate-700">
              <Image src="/logo.png" alt="BloodMatch Logo" width={36} height={36} className="w-full h-full object-cover" />
            </div>
            <span className="tracking-tight text-xl font-black bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">BloodMatch</span>
          </Link>
          <p className="text-xs text-gray-500 dark:text-slate-400 text-center md:text-left max-w-xs font-medium leading-relaxed">
            Emergency automated medical matching ecosystem. Fast, medically rigorous, and 100% free for local communities.
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200/80 dark:border-green-900/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              <ShieldCheck className="w-3 h-3" />
              <span>SSL Secure Hub</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200/80 dark:border-red-900/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              <Sparkles className="w-3 h-3" />
              <span>Universal 8 Types</span>
            </span>
          </div>
        </div>

        {/* Quick Premium Nav Links */}
        <div className="md:col-span-4 flex flex-wrap items-center justify-center md:justify-end gap-6 text-xs text-gray-600 dark:text-slate-300 font-bold uppercase tracking-wider">
          <Link href="/" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">Home</Link>
          <Link href="/radar" className="hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1 text-red-700 dark:text-red-400 font-black">
            <span>Radar</span>
          </Link>
          <Link href="/register?role=donor" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">Become Donor</Link>
          <Link href="/dashboard/request/new" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">Request Blood</Link>
          <Link href="/login" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">Login</Link>
        </div>

        {/* Hackathon Attribution Badge */}
        <div className="md:col-span-3 flex flex-col items-center md:items-end justify-center text-xs text-gray-400 dark:text-slate-500 font-bold">
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-3.5 py-2 rounded-2xl shadow-inner">
            <span>Built with</span>
            <Heart className="w-4 h-4 text-red-600 fill-red-600 animate-pulse" />
            <span>for CODECRAFT</span>
          </div>
          <span className="text-[10px] text-gray-400 dark:text-slate-500 mt-2">© 2026 BloodMatch Logistics</span>
        </div>

      </div>
    </footer>
  );
};
