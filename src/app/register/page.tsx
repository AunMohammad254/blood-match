"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BLOOD_TYPES, CITIES, Role, BloodType } from "@/lib/constants";
import { isLoggedIn } from "@/lib/auth";
import { registerUser } from "@/lib/api";
import { ArrowLeft, CheckCircle2, UserPlus, HeartHandshake, PhoneCall, Mail, Lock, Phone, Droplets, MapPin, Eye, EyeOff } from "lucide-react";
import { PremiumSelect } from "@/components/ui/PremiumSelect";
import { logger } from "@/lib/logger";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [role, setRole] = useState<Role>("donor");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [bloodType, setBloodType] = useState<BloodType>("A+");
  const [city, setCity] = useState(CITIES[0] as string);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [location, setLocation] = useState<{ type: "Point", coordinates: [number, number] } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) {
      router.push("/dashboard");
    }
    const roleParam = searchParams.get("role");
    if (roleParam === "donor" || roleParam === "recipient") {
      setRole(roleParam);
    }
  }, [searchParams, router]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = "Full Name is required.";
    else if (name.trim().length < 2 || name.trim().length > 60)
      errors.name = "Name must be between 2 and 60 characters.";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) errors.email = "Email is required.";
    else if (!emailRegex.test(email))
      errors.email = "Please enter a valid email address.";

    if (!password) errors.password = "Password is required.";
    else if (password.length < 6)
      errors.password = "Password must be at least 6 characters.";

    const phoneRegex = /^\d{10,}$/;
    if (!phone.trim()) errors.phone = "Phone number is required.";
    else if (!phoneRegex.test(phone.trim()))
      errors.phone = "Please enter at least 10 numeric digits.";

    if (!bloodType) errors.bloodType = "Blood Type is required.";
    if (!city) errors.city = "City is required.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const captureLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            type: "Point",
            coordinates: [position.coords.longitude, position.coords.latitude]
          });
          setIsLocating(false);
        },
        (error) => {
          logger.error("Geolocation error:", error);
          setFormError("Could not fetch location. You can continue without it.");
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setFormError("Geolocation is not supported by your browser.");
      setIsLocating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!validate()) return;

    setIsLoading(true);
    try {
      await registerUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        bloodType,
        city,
        role,
        ...(location && { location })
      });

      setIsSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      setFormError(
        err.response?.data?.error || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-12 text-center max-w-md w-full animate-fadeIn space-y-6">
        <div className="w-20 h-20 bg-green-50 dark:bg-green-950/20 text-green-650 dark:text-green-400 rounded-full flex items-center justify-center mx-auto shadow-inner border border-green-200 dark:border-green-900/40">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Account Created!</h2>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider mt-1">Calibrating Transfusion Profile</p>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
          Redirecting to command authorization gateway...
        </p>
        <div className="w-8 h-8 border-4 border-red-200 border-t-red-650 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-150 dark:border-slate-800 p-8 sm:p-12 max-w-lg w-full relative z-10 group">
      
      {/* Return home link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition mb-6 focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded-lg p-0.5"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return Home</span>
      </Link>

      <div className="text-center">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-red-600 to-red-800 text-white flex items-center justify-center text-3xl shadow-lg shadow-red-500/30 mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform">
          <span>🩸</span>
        </div>
        <h1 className="text-3xl font-black text-slate-905 dark:text-white tracking-tight">Create Your Account</h1>
        <p className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase tracking-wider mt-1">Join Local Transfusion Network</p>
      </div>

      {/* Interactive Role Toggle */}
      <div className="mt-8">
        <span className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 text-center">
          Choose Your User Profile Role
        </span>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole("donor")}
            className={`py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 ${
              role === "donor"
                ? "bg-red-600 text-white shadow-lg shadow-red-500/30"
                : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 border-2 border-slate-200/80 dark:border-slate-700/80"
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Active Donor</span>
          </button>

          <button
            type="button"
            onClick={() => setRole("recipient")}
            className={`py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 ${
              role === "recipient"
                ? "bg-red-600 text-white shadow-lg shadow-red-500/30"
                : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 border-2 border-slate-200/80 dark:border-slate-700/80"
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            <span>Need Blood</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mt-8">
        <div>
          <label htmlFor="regName" className="block text-xs font-black text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5 text-red-655" />
            <span>Full Verified Name <span className="text-red-655">*</span></span>
          </label>
          <input
            id="regName"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: "" });
            }}
            placeholder="e.g. Aun Abbas"
            required
            className="w-full bg-slate-50/90 dark:bg-slate-800/90 border-2 border-slate-200/80 dark:border-slate-700/80 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
          />
          {fieldErrors.name && (
            <p className="text-red-600 dark:text-red-400 text-xs mt-1 font-bold">{fieldErrors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="regEmail" className="block text-xs font-black text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-red-655" />
            <span>Email Address <span className="text-red-655">*</span></span>
          </label>
          <input
            id="regEmail"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" });
            }}
            placeholder="e.g. aun@example.com"
            required
            className="w-full bg-slate-50/90 dark:bg-slate-800/90 border-2 border-slate-200/80 dark:border-slate-700/80 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
          />
          {fieldErrors.email && (
            <p className="text-red-600 dark:text-red-400 text-xs mt-1 font-bold">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="regPassword" className="block text-xs font-black text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-red-655" />
            <span>Account Password <span className="text-red-655">*</span></span>
          </label>
          <div className="relative">
            <input
              id="regPassword"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: "" });
              }}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
              className="w-full bg-slate-50/90 dark:bg-slate-800/90 border-2 border-slate-200/80 dark:border-slate-700/80 rounded-2xl px-4 py-3.5 pr-12 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
            <button
              type="button"
              id="reg-toggle-password-visibility"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-red-600 dark:text-red-400 text-xs mt-1 font-bold">{fieldErrors.password}</p>
          )}
        </div>

        <div>
          <label htmlFor="regPhone" className="block text-xs font-black text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-red-655" />
            <span>Cellular Phone Number <span className="text-red-655">*</span></span>
          </label>
          <input
            id="regPhone"
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: "" });
            }}
            placeholder="e.g. 03001234567"
            required
            className="w-full bg-slate-50/90 dark:bg-slate-800/90 border-2 border-slate-200/80 dark:border-slate-700/80 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-500/50 dark:focus:border-red-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
          />
          {fieldErrors.phone && (
            <p className="text-red-600 dark:text-red-400 text-xs mt-1 font-bold">{fieldErrors.phone}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="regBlood" className="block text-xs font-black text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-red-655" />
              <span>Blood Group <span className="text-red-655">*</span></span>
            </label>
            <PremiumSelect
              value={bloodType}
              onChange={(val) => setBloodType(val as BloodType)}
              options={BLOOD_TYPES.map((bt) => ({ value: bt, label: bt }))}
              placeholder="Select Blood Type"
            />
          </div>

          <div>
            <label htmlFor="regCity" className="block text-xs font-black text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-red-655" />
              <span>City Hub <span className="text-red-655">*</span></span>
            </label>
            <PremiumSelect
              value={city}
              onChange={(val) => setCity(val)}
              options={CITIES.map((c) => ({ value: c, label: `${c} Center` }))}
              placeholder="Select City"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={captureLocation}
            disabled={isLocating || !!location}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 border-2 ${
              location
                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/40"
                : "bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/80 dark:hover:bg-slate-750"
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>
              {location
                ? "Location Captured"
                : isLocating
                ? "Detecting Location..."
                : "Capture Exact Location (Optional)"}
            </span>
          </button>
        </div>

        {formError && (
          <div className="p-3.5 bg-red-50 dark:bg-red-955/35 rounded-2xl border border-red-200 dark:border-red-900/40 text-xs font-black text-red-700 dark:text-red-300 animate-fadeIn">
            <span>{formError}</span>
          </div>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-4 text-xs font-black uppercase tracking-widest shadow-xl shadow-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-red-200 border-t-white rounded-full animate-spin" />
                <span>Enrolling Profile...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <UserPlus className="w-4 h-4" />
                <span>Create Registered Account</span>
              </div>
            )}
          </button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
        <span className="text-xs text-slate-500 dark:text-slate-450 font-medium">Already enrolled? </span>
        <Link href="/login" className="text-xs text-red-650 dark:text-red-400 font-black hover:underline tracking-wider uppercase ml-1 focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded p-0.5">
          Authorize Login →
        </Link>
      </div>

    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-slate-50 via-white to-rose-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-red-950/10 flex items-center justify-center py-16 px-4 relative overflow-hidden">
      
      {/* Ambient Glows */}
      <div className="absolute -top-10 left-10 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

      <Suspense fallback={<div className="w-12 h-12 border-4 border-red-200 border-t-red-650 rounded-full animate-spin relative z-10" />}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
