"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isLoggedIn, saveAuth } from "@/lib/auth";
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
      router.push("/dashboard");
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

      const { token, user } = res.data;
      saveAuth(token, user);
      
      // Dispatch storage event so navbar instantly picks up user
      window.dispatchEvent(new Event("storage"));

      router.push("/dashboard");
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

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-gray-50 via-white to-red-50/20 flex items-center justify-center py-16 px-4 relative overflow-hidden animate-fadeIn">
      
      {/* Ambient Meshes */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-xl border border-gray-100/90 p-8 sm:p-12 max-w-md w-full relative z-10 group">
        
        {/* Navigation Top link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-xs font-bold transition mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return Home</span>
        </Link>

        <div className="text-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-red-600 to-red-800 text-white flex items-center justify-center text-3xl shadow-lg shadow-red-500/30 mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
            <span>🩸</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Welcome Back</h1>
          <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider">
            Access Command Dashboard
          </p>
        </div>

        {/* Demo Credentials Suite */}
        <div className="mt-8 bg-gradient-to-br from-red-50 to-rose-50 border border-red-200/80 rounded-2xl p-4 text-xs text-gray-800 shadow-inner">
          <div className="flex items-center gap-2 font-black text-red-950 uppercase tracking-wider mb-2.5">
            <Sparkles className="w-4 h-4 text-red-600 animate-pulse" />
            <span>1-Click Live Test Accounts</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              type="button"
              onClick={fillDemoDonor}
              className="bg-white hover:bg-red-600 text-red-700 hover:text-white border border-red-200 hover:border-transparent py-2.5 px-3 rounded-xl font-black text-[11px] shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <span>🤝 Donor (Aun)</span>
            </button>
            <button
              type="button"
              onClick={fillDemoRecipient}
              className="bg-white hover:bg-red-600 text-red-700 hover:text-white border border-red-200 hover:border-transparent py-2.5 px-3 rounded-xl font-black text-[11px] shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <span>🏥 Recipient (Dr.)</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-8">
          <div>
            <label htmlFor="loginEmail" className="block text-xs font-black text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
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
              className="w-full bg-gray-50/90 border-2 border-gray-200/80 rounded-2xl px-4 py-3.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label htmlFor="loginPassword" className="block text-xs font-black text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
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
                className="w-full bg-gray-50/90 border-2 border-gray-200/80 rounded-2xl px-4 py-3.5 pr-12 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition"
              />
              <button
                type="button"
                id="toggle-password-visibility"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 rounded-2xl border border-red-200 flex items-center gap-2 text-xs font-black text-red-700 animate-fadeIn">
              <Info className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-4 text-xs font-black uppercase tracking-widest shadow-xl shadow-red-500/30"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-red-200 border-t-white rounded-full animate-spin" />
                  <span>Authorizing Session...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Authenticate Login</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <span className="text-xs text-gray-500 font-medium">Don&apos;t have an account? </span>
          <Link href="/register?role=donor" className="text-xs text-red-600 font-black hover:underline tracking-wider uppercase ml-1">
            Register Account →
          </Link>
        </div>

      </div>
    </div>
  );
}
