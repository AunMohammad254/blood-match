"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isLoggedIn, saveAuth, getUser } from "@/lib/auth";
import { loginUser } from "@/lib/api";
import { Info, Lock, Mail, Sparkles, UserCheck, ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) {
      const user = getUser();
      if (user?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await loginUser({
        email: email.trim().toLowerCase(),
        password,
      });

      const { token, user: loggedInUser } = res.data;
      saveAuth(token, loggedInUser);
      
      // Dispatch storage event so navbar instantly picks up user
      window.dispatchEvent(new Event("storage"));

      if (loggedInUser?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError("Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoDonor = () => {
    setEmail("aun@example.com");
    setPassword("secret123");
  };

  const fillDemoRecipient = () => {
    setEmail("recipient@example.com");
    setPassword("secret123");
  };

  const fillDemoAdmin = () => {
    setEmail("admin@bloodmatch.com");
    setPassword("secret123");
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-slate-50 via-white to-red-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-red-950/10 flex items-center justify-center py-16 px-4 relative overflow-hidden animate-fadeIn">
      
      {/* Ambient Meshes */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-xl border border-slate-150 dark:border-slate-800 p-8 sm:p-12 max-w-md w-full relative z-10 group">
        
        {/* Navigation Top link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition mb-6 focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded-lg p-0.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return Home</span>
        </Link>

        <div className="text-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-red-600 to-red-800 text-white flex items-center justify-center text-3xl shadow-lg shadow-red-500/30 mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
            <span>🩸</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Welcome Back</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1 uppercase tracking-wider">
            Access Command Dashboard
          </p>
        </div>

        {/* Demo Credentials Suite */}
        <div className="mt-8 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/25 border border-red-200/80 dark:border-red-900/40 rounded-2xl p-4 text-xs text-slate-800 dark:text-slate-300 shadow-inner">
          <div className="flex items-center gap-2 font-black text-red-950 dark:text-red-400 uppercase tracking-wider mb-2.5">
            <Sparkles className="w-4 h-4 text-red-650 animate-pulse" />
            <span>1-Click Live Test Accounts</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              type="button"
              onClick={fillDemoDonor}
              className="bg-white dark:bg-slate-800 hover:bg-red-600 dark:hover:bg-red-700 text-red-700 dark:text-red-300 hover:text-white border border-red-200 dark:border-slate-700 hover:border-transparent py-2.5 px-3 rounded-xl font-black text-[11px] shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <span>🤝 Donor (Aun)</span>
            </button>
            <button
              type="button"
              onClick={fillDemoRecipient}
              className="bg-white dark:bg-slate-800 hover:bg-red-600 dark:hover:bg-red-700 text-red-700 dark:text-red-300 hover:text-white border border-red-200 dark:border-slate-700 hover:border-transparent py-2.5 px-3 rounded-xl font-black text-[11px] shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <span>🏥 Recipient (Dr.)</span>
            </button>
          </div>
          <button
            type="button"
            onClick={fillDemoAdmin}
            className="w-full mt-2 bg-white dark:bg-slate-800 hover:bg-slate-950 hover:text-white dark:hover:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-transparent py-2.5 px-3 rounded-xl font-black text-[11px] shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          >
            <span>🛡️ Super Admin (Verified)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-8">
          <div>
            <label htmlFor="loginEmail" className="block text-xs font-black text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-red-600" />
              <span>Email Address</span>
            </label>
            <input
              id="loginEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. aun@example.com"
              required
              className="w-full bg-slate-50/90 dark:bg-slate-800/90 border-2 border-slate-200/80 dark:border-slate-700/80 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
          </div>

          <div>
            <label htmlFor="loginPassword" className="block text-xs font-black text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-red-600" />
              <span>Password</span>
            </label>
            <div className="relative">
              <input
                id="loginPassword"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-50/90 dark:bg-slate-800/90 border-2 border-slate-200/80 dark:border-slate-700/80 rounded-2xl px-4 py-3.5 pr-12 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
              />
              <button
                type="button"
                id="toggle-password-visibility"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-650 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-955/35 rounded-2xl border border-red-200 dark:border-red-900/40 flex items-center gap-2 text-xs font-black text-red-700 dark:text-red-300 animate-fadeIn">
              <Info className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-4 text-xs font-black uppercase tracking-widest shadow-xl shadow-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-red-200 border-t-white rounded-full animate-spin" />
                  <span>Authorizing Session...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  <span>Authenticate Login</span>
                </div>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <span className="text-xs text-slate-500 dark:text-slate-450 font-medium">Don&apos;t have an account? </span>
          <Link href="/register?role=donor" className="text-xs text-red-600 dark:text-red-400 font-black hover:underline tracking-wider uppercase ml-1 focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded p-0.5">
            Register Account →
          </Link>
        </div>

      </div>
    </div>
  );
}
