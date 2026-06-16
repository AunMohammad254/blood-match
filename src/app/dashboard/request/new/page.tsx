"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BLOOD_TYPES, CITIES, URGENCY_LEVELS, BloodType, UrgencyLevel } from "@/lib/constants";
import { createRequest } from "@/lib/api";
import { ArrowLeft, Send, Sparkles, AlertTriangle, Bell, Droplets } from "lucide-react";

function CreateRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [patientName, setPatientName] = useState("");
  const [bloodType, setBloodType] = useState<BloodType>("A+");
  const [units, setUnits] = useState("1");
  const [urgency, setUrgency] = useState<UrgencyLevel>("urgent");
  const [hospital, setHospital] = useState("");
  const [city, setCity] = useState(CITIES[0] as string);
  const [contactPhone, setContactPhone] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const pName = searchParams.get("patientName");
    const bType = searchParams.get("bloodType");
    const uUnits = searchParams.get("units");
    const uUrgency = searchParams.get("urgency");
    const hHospital = searchParams.get("hospital");
    const cCity = searchParams.get("city");
    const pPhone = searchParams.get("contactPhone");

    if (pName) setPatientName(pName);
    if (bType && BLOOD_TYPES.includes(bType as BloodType)) setBloodType(bType as BloodType);
    if (uUnits) setUnits(uUnits);
    if (uUrgency && URGENCY_LEVELS.includes(uUrgency as UrgencyLevel)) setUrgency(uUrgency as UrgencyLevel);
    if (hHospital) setHospital(hHospital);
    if (cCity && (CITIES as readonly string[]).includes(cCity)) setCity(cCity as any);
    if (pPhone) setContactPhone(pPhone);
  }, [searchParams]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!patientName.trim()) errors.patientName = "Patient Name is required.";
    else if (patientName.trim().length < 2)
      errors.patientName = "Patient name must be at least 2 characters.";

    const numUnits = Number(units);
    if (!units || isNaN(numUnits) || numUnits < 1 || numUnits > 20)
      errors.units = "Units needed must be between 1 and 20.";

    if (!hospital.trim()) errors.hospital = "Hospital Name is required.";
    else if (hospital.trim().length < 3)
      errors.hospital = "Hospital name must be at least 3 characters.";

    const phoneRegex = /^\d{10,}$/;
    if (!contactPhone.trim()) errors.contactPhone = "Contact Phone is required.";
    else if (!phoneRegex.test(contactPhone.trim()))
      errors.contactPhone = "Please enter at least 10 numeric digits.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!validate()) return;

    setIsLoading(true);
    try {
      await createRequest({
        patientName: patientName.trim(),
        bloodType,
        units: Number(units),
        hospital: hospital.trim(),
        city,
        urgency,
        contactPhone: contactPhone.trim(),
      });

      setIsSuccess(true);
    } catch (err: any) {
      setFormError(
        err.response?.data?.error || "Failed to post request. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPatientName("");
    setBloodType("A+");
    setUnits("1");
    setUrgency("urgent");
    setHospital("");
    setCity(CITIES[0] as string);
    setContactPhone("");
    setFieldErrors({});
    setFormError("");
    setIsSuccess(false);
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center animate-fadeIn">
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Request posted successfully!
          </h2>
          <p className="text-base text-gray-600 max-w-md mx-auto mb-10 leading-relaxed">
            Compatible active blood donors in <strong>{city}</strong> have been alerted about this urgent request.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/dashboard/match?bloodType=${encodeURIComponent(bloodType)}&city=${encodeURIComponent(city)}`}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3.5 rounded-xl transition shadow-sm flex items-center justify-center gap-2 text-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Find Matching Donors</span>
            </Link>

            <button
              type="button"
              onClick={resetForm}
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold px-6 py-3.5 rounded-xl transition text-sm flex items-center justify-center"
            >
              Post Another Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Page header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-medium transition mb-4 -ml-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Post Blood Request</h1>
        <p className="text-sm text-gray-600 mt-1.5">
          Fill in the emergency details below. Compatible registered donors will be instantly alerted.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reqPatient" className="block text-sm font-medium text-gray-700 mb-1">
                Patient Name <span className="text-red-500">*</span>
              </label>
              <input
                id="reqPatient"
                type="text"
                value={patientName}
                onChange={(e) => {
                  setPatientName(e.target.value);
                  if (fieldErrors.patientName)
                    setFieldErrors({ ...fieldErrors, patientName: "" });
                }}
                placeholder="e.g. Zara Khan"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              />
              {fieldErrors.patientName && (
                <p className="text-red-500 text-xs mt-1 font-medium">
                  {fieldErrors.patientName}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="reqBloodType" className="block text-sm font-medium text-gray-700 mb-1">
                Blood Type Needed <span className="text-red-500">*</span>
              </label>
              <select
                id="reqBloodType"
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value as BloodType)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white font-medium"
              >
                {BLOOD_TYPES.map((bt) => (
                  <option key={bt} value={bt}>
                    {bt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reqUnits" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-red-500" />
                <span>Units Needed (1-20)</span> <span className="text-red-500">*</span>
              </label>
              <input
                id="reqUnits"
                type="number"
                min={1}
                max={20}
                value={units}
                onChange={(e) => {
                  setUnits(e.target.value);
                  if (fieldErrors.units)
                    setFieldErrors({ ...fieldErrors, units: "" });
                }}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              />
              {fieldErrors.units && (
                <p className="text-red-500 text-xs mt-1 font-medium">
                  {fieldErrors.units}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="reqUrgency" className="block text-sm font-medium text-gray-700 mb-1">
                Urgency Level <span className="text-red-500">*</span>
              </label>
              <select
                id="reqUrgency"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                required
                className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-medium ${
                  urgency === "critical"
                    ? "bg-red-50 border-red-300 text-red-800"
                    : urgency === "urgent"
                    ? "bg-yellow-50 border-yellow-300 text-yellow-800"
                    : "bg-gray-50 border-gray-300 text-gray-800"
                }`}
              >
                {URGENCY_LEVELS.map((u) => (
                  <option key={u} value={u} className="bg-white text-gray-900">
                    {u === "critical" && "🔴 Critical"}
                    {u === "urgent" && "🟡 Urgent"}
                    {u === "normal" && "🟢 Normal"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Urgency Visual Hint Banner */}
          {urgency === "critical" && (
            <div className="p-4 bg-red-50 rounded-2xl border border-red-200 flex items-start gap-3 animate-fadeIn">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-red-800 leading-relaxed">
                ⚠️ Critical requests are shown at the top of all donor feeds. Please use only for extreme medical emergencies.
              </p>
            </div>
          )}

          {urgency === "urgent" && (
            <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-200 flex items-start gap-3 animate-fadeIn">
              <Bell className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-yellow-800 leading-relaxed">
                🔔 Urgent requests are highlighted to donors nearby and prioritized in real-time alert logs.
              </p>
            </div>
          )}

          {/* Row 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reqHospital" className="block text-sm font-medium text-gray-700 mb-1">
                Hospital Name <span className="text-red-500">*</span>
              </label>
              <input
                id="reqHospital"
                type="text"
                value={hospital}
                onChange={(e) => {
                  setHospital(e.target.value);
                  if (fieldErrors.hospital)
                    setFieldErrors({ ...fieldErrors, hospital: "" });
                }}
                placeholder="e.g. Aga Khan Hospital"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              />
              {fieldErrors.hospital && (
                <p className="text-red-500 text-xs mt-1 font-medium">
                  {fieldErrors.hospital}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="reqCity" className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <select
                id="reqCity"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white font-medium"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4 */}
          <div>
            <label htmlFor="reqPhone" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              id="reqPhone"
              type="tel"
              value={contactPhone}
              onChange={(e) => {
                setContactPhone(e.target.value);
                if (fieldErrors.contactPhone)
                  setFieldErrors({ ...fieldErrors, contactPhone: "" });
              }}
              placeholder="e.g. 03111234567"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            />
            {fieldErrors.contactPhone && (
              <p className="text-red-500 text-xs mt-1 font-medium">
                {fieldErrors.contactPhone}
              </p>
            )}
          </div>

          {formError && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200 mt-2">
              <p className="text-red-600 text-xs font-semibold">{formError}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-sm text-base"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-red-200 border-t-white rounded-full animate-spin" />
                  <span>Posting Request...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Post Blood Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateRequestPage() {
  return (
    <Suspense fallback={<div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mt-20" />}>
      <CreateRequestForm />
    </Suspense>
  );
}
