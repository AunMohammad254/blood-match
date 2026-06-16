import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShieldCheck, Sparkles, PhoneCall } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100 py-16 mt-auto">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-12 gap-10 items-center justify-between">
        
        {/* Brand Brand Identity */}
        <div className="md:col-span-5 flex flex-col items-center md:items-start gap-3">
          <Link href="/" className="flex items-center gap-3 font-black text-xl text-gray-900">
            <div className="w-9 h-9 rounded-xl shadow-xs overflow-hidden bg-gray-900 flex items-center justify-center border border-gray-800">
              <Image src="/logo.png" alt="BloodMatch Logo" width={36} height={36} className="w-full h-full object-cover" />
            </div>
            <span className="tracking-tight text-xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">BloodMatch</span>
          </Link>
          <p className="text-xs text-gray-500 text-center md:text-left max-w-xs font-medium leading-relaxed">
            Emergency automated medical matching ecosystem. Fast, medically rigorous, and 100% free for local communities.
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200/80 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              <ShieldCheck className="w-3 h-3" />
              <span>SSL Secure Hub</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200/80 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              <Sparkles className="w-3 h-3" />
              <span>Universal 8 Types</span>
            </span>
          </div>
        </div>

        {/* Quick Premium Nav Links */}
        <div className="md:col-span-4 flex flex-wrap items-center justify-center md:justify-end gap-6 text-xs text-gray-600 font-bold uppercase tracking-wider">
          <Link href="/" className="hover:text-red-600 transition-colors">Home</Link>
          <Link href="/radar" className="hover:text-red-600 transition-colors flex items-center gap-1 text-red-700 font-black">
            <span>Radar</span>
          </Link>
          <Link href="/register?role=donor" className="hover:text-red-600 transition-colors">Become Donor</Link>
          <Link href="/dashboard/request/new" className="hover:text-red-600 transition-colors">Request Blood</Link>
          <Link href="/login" className="hover:text-red-600 transition-colors">Login</Link>
        </div>

        {/* Hackathon Attribution Badge */}
        <div className="md:col-span-3 flex flex-col items-center md:items-end justify-center text-xs text-gray-400 font-bold">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3.5 py-2 rounded-2xl shadow-inner">
            <span>Built with</span>
            <Heart className="w-4 h-4 text-red-600 fill-red-600 animate-pulse" />
            <span>for CODECRAFT</span>
          </div>
          <span className="text-[10px] text-gray-400 mt-2">© 2026 BloodMatch Logistics</span>
        </div>

      </div>
    </footer>
  );
};
