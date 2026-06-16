import React from "react";
import Link from "next/link";
import { ArrowRight, HeartHandshake, Search, PhoneCall, ShieldCheck, Sparkles, Activity, Globe, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      
      {/* Premium Ambient Background Meshes */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-red-500/10 via-rose-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-red-400/10 rounded-full blur-3xl pointer-events-none animate-float -z-10" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-rose-400/10 rounded-full blur-3xl pointer-events-none animate-float-delayed -z-10" />

      {/* Hero Section */}
      <section className="w-full py-20 sm:py-32 px-4 relative z-10 border-b border-gray-100/80">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Live Triage Status Ticker Chip */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-md border border-red-200/80 shadow-md mb-8 hover:scale-105 transition-transform duration-300">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-sm shadow-red-500/50" />
            <span className="text-xs font-black tracking-wider uppercase text-red-950">Real-Time Emergency Matching Engine Active</span>
            <Activity className="w-3.5 h-3.5 text-red-600 ml-1" />
          </div>

          {/* Emotional Insignia Drop */}
          <div className="relative inline-block mb-8 group">
            <div className="absolute -inset-4 bg-gradient-to-r from-red-600 to-rose-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-300 animate-pulse" />
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-red-600 via-red-600 to-red-800 text-white flex items-center justify-center text-6xl sm:text-7xl shadow-2xl relative z-10 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 border-4 border-white">
              <span className="transform -translate-y-1">🩸</span>
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 tracking-tight leading-[1.08] max-w-3xl mx-auto">
            Save Lives. <br />
            <span className="bg-gradient-to-r from-red-600 via-rose-600 to-red-800 bg-clip-text text-transparent">Donate Blood.</span>
          </h1>

          <p className="text-lg sm:text-2xl text-gray-600 font-medium mt-6 max-w-2xl mx-auto leading-relaxed">
            BloodMatch connects active blood donors directly to hospital patients in urgent medical emergencies — <strong className="text-gray-900 font-extrabold">fast, verified, and 100% free</strong>.
          </p>

          {/* Quick Dual Action Suite */}
          <div className="mt-12 flex flex-col sm:flex-row gap-5 justify-center items-center max-w-md mx-auto">
            <Link
              href="/register?role=donor"
              className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black px-9 py-4 rounded-2xl shadow-xl shadow-red-500/30 hover:shadow-red-500/50 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 text-base tracking-wider uppercase group"
            >
              <span>Register as Donor</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </Link>
            <Link
              href="/dashboard/request/new"
              className="w-full sm:w-auto bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border-2 border-red-600 font-black px-9 py-4 rounded-2xl shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 text-base tracking-wider uppercase"
            >
              <PhoneCall className="w-5 h-5" />
              <span>Request Blood</span>
            </Link>
          </div>

          {/* Sub Summary Grid */}
          <div className="mt-16 pt-10 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-6 text-center max-w-3xl mx-auto text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span className="flex items-center justify-center gap-1.5"><ShieldCheck className="w-4 h-4 text-green-600" /> Verified Donors</span>
            <span className="flex items-center justify-center gap-1.5"><Activity className="w-4 h-4 text-red-600" /> Instant Triage</span>
            <span className="flex items-center justify-center gap-1.5"><Globe className="w-4 h-4 text-blue-600" /> 10 Major Cities</span>
            <span className="flex items-center justify-center gap-1.5"><Users className="w-4 h-4 text-purple-600" /> Free Forever</span>
          </div>

        </div>
      </section>

      {/* Swiss Inspired Triage Ticker */}
      <section className="bg-gray-900 text-white py-6 overflow-hidden border-y border-gray-800">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between text-xs font-mono font-bold gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
            <span className="text-gray-400">SYSTEM LOG:</span>
            <span className="text-green-400">Transfusion Protocol v1.4 Active</span>
          </div>
          <div className="flex items-center gap-6 text-gray-400 hidden sm:flex">
            <span>Universal Donor: O-</span>
            <span>Universal Recipient: AB+</span>
            <span className="text-red-400 font-sans font-bold">🚨 15m Maximum Hospital Triage Target</span>
          </div>
        </div>
      </section>

      {/* How It Works Layered Glass Section */}
      <section className="py-28 sm:py-36 px-4 bg-white relative">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-xs font-black tracking-widest uppercase text-red-600 bg-red-50 px-3.5 py-1.5 rounded-full inline-block mb-3">Flawless Logistics</span>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">How BloodMatch Works</h2>
            <p className="text-base sm:text-lg text-gray-600 mt-4 leading-relaxed font-medium">
              We replaced unverified social media posting with an instant, medically precise hematological Triaging workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="glass-card bg-gray-50/70 p-10 rounded-3xl flex flex-col justify-between group">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center text-red-600 mb-8 border border-gray-100 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  <HeartHandshake className="w-8 h-8 text-red-600" />
                </div>
                <span className="font-mono text-xs font-extrabold text-red-600 uppercase tracking-widest block mb-1">Step 01</span>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Register & Calibrate</h3>
                <p className="text-sm text-gray-600 mt-3 leading-relaxed font-medium">
                  Sign up as a blood donor or recipient. Our platform instantly logs your exact medical blood group and geographical Triage center.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-gray-200/60 flex items-center justify-between text-xs font-extrabold text-gray-400">
                <span>Secure JSON Mappings</span>
                <span>✓ SSL</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="glass-card bg-gray-50/70 p-10 rounded-3xl flex flex-col justify-between group">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center text-red-600 mb-8 border border-gray-100 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  <Search className="w-8 h-8 text-red-600" />
                </div>
                <span className="font-mono text-xs font-extrabold text-red-600 uppercase tracking-widest block mb-1">Step 02</span>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Automated Triage</h3>
                <p className="text-sm text-gray-600 mt-3 leading-relaxed font-medium">
                  Our hematological matching matrix instantaneously filters verified lifesavers nearby who are medically compatible with the patient.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-gray-200/60 flex items-center justify-between text-xs font-extrabold text-gray-400">
                <span>Medical Transfusion Engine</span>
                <span>⚡ &lt; 1s</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="glass-card bg-gray-50/70 p-10 rounded-3xl flex flex-col justify-between group">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center text-red-600 mb-8 border border-gray-100 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  <PhoneCall className="w-8 h-8 text-red-600" />
                </div>
                <span className="font-mono text-xs font-extrabold text-red-600 uppercase tracking-widest block mb-1">Step 03</span>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Cellular Dispatch</h3>
                <p className="text-sm text-gray-600 mt-3 leading-relaxed font-medium">
                  Tap the verified telephone link to initiate an immediate direct cellular call with the donor or hospital staff. Zero middle-men.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-gray-200/60 flex items-center justify-between text-xs font-extrabold text-gray-400">
                <span>Direct Cellular Connectivity</span>
                <span>📞 tel: Links</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Authoritative Swiss Stats Hub */}
      <section className="py-24 bg-gradient-to-r from-red-700 via-red-600 to-rose-700 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
        
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 text-center divide-y sm:divide-y-0 sm:divide-x divide-red-500/60">
            
            <div className="p-4 sm:p-0">
              <span className="text-5xl sm:text-6xl font-black tracking-tight block">8 Types</span>
              <span className="text-sm font-black uppercase tracking-widest mt-2 block opacity-90">Universal Triage Matrix</span>
            </div>

            <div className="p-4 sm:p-0">
              <span className="text-5xl sm:text-6xl font-black tracking-tight block">Real-Time</span>
              <span className="text-sm font-black uppercase tracking-widest mt-2 block opacity-90">Instant Active Toggling</span>
            </div>

            <div className="p-4 sm:p-0">
              <span className="text-5xl sm:text-6xl font-black tracking-tight block">100% Free</span>
              <span className="text-sm font-black uppercase tracking-widest mt-2 block opacity-90">Free Forever for Everyone</span>
            </div>

          </div>
        </div>
      </section>

      {/* High Impact Emotional Footer Ticker */}
      <section className="py-28 px-4 bg-gray-50 text-center relative border-t border-gray-200/80">
        <div className="max-w-4xl mx-auto">
          <span className="text-6xl sm:text-7xl block mb-6 animate-bounce">🚑</span>
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
            Every second counts in an emergency.
          </h2>
          <p className="text-lg sm:text-2xl text-gray-600 font-medium mt-4 max-w-xl mx-auto">
            Become a verifiable lifeline in your local neighborhood right now.
          </p>
          
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/register?role=donor"
              className="btn-primary py-4 px-10 text-base font-black tracking-wider uppercase shadow-2xl shadow-red-500/40"
            >
              <Sparkles className="w-5 h-5" />
              <span>Join BloodMatch Today</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
