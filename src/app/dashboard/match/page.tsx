"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BloodType, BLOOD_TYPES } from "@/lib/constants";
import { matchDonors } from "@/lib/api";
import { DonorCard } from "@/components/DonorCard";
import { MatchSearchForm } from "@/components/MatchSearchForm";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { AlertCircle, Sparkles } from "lucide-react";

function MatchResults() {
  const searchParams = useSearchParams();

  const [bloodType, setBloodType] = useState<BloodType>("A+");
  const [city, setCity] = useState("");
  const [compatibleTypes, setCompatibleTypes] = useState<BloodType[]>([]);
  const [donors, setDonors] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const btParam = searchParams.get("bloodType");
    const cityParam = searchParams.get("city");

    let initialBt: BloodType = "A+";
    let initialCity = "";

    if (btParam && BLOOD_TYPES.includes(btParam as BloodType)) {
      initialBt = btParam as BloodType;
      setBloodType(initialBt);
    }
    if (cityParam) {
      initialCity = cityParam;
      setCity(initialCity);
    }

    // Automatically trigger search if bloodType was provided
    if (btParam) {
      executeSearch(initialBt, initialCity);
    }
  }, [searchParams]);

  const executeSearch = async (targetBt: string, targetCity: string) => {
    if (!targetBt) return;
    setIsLoading(true);
    setError("");
    setHasSearched(true);
    setBloodType(targetBt as BloodType);
    setCity(targetCity);

    try {
      const res = await matchDonors(targetBt as BloodType, targetCity || undefined);
      const data = res.data;
      setCompatibleTypes(data.compatibleTypes || []);
      setDonors(data.donors || []);
    } catch (err: any) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Find Compatible Donors</h1>
        <p className="text-sm text-gray-600 mt-1.5">
          Search by blood type and city to instantly find available verified donors nearby.
        </p>
      </div>

      {/* Search Form Card */}
      <MatchSearchForm
        defaultBloodType={bloodType}
        defaultCity={city}
        onSearch={executeSearch}
        isLoading={isLoading}
      />

      {/* Results Section */}
      <div className="mt-10">
        {isLoading && <LoadingSpinner message="Searching compatible active donors..." />}

        {error && (
          <div className="p-4 bg-red-50 rounded-2xl border border-red-200 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-red-700 font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => executeSearch(bloodType, city)}
              className="px-4 py-1.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 rounded-xl font-semibold transition"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && hasSearched && donors.length > 0 && (
          <div className="animate-fadeIn">
            <div className="mb-6 bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-red-600" />
                  <span>
                    Found {donors.length} compatible donor{donors.length > 1 ? "s" : ""} {city ? `in ${city}` : "overall"}
                  </span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Requested for <strong className="text-red-700 font-semibold">{bloodType}</strong> · Universal Compatibility with: <span className="font-semibold text-gray-700">{compatibleTypes.join(", ")}</span>
                </p>
              </div>
              <span className="self-start sm:self-auto text-xs bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full">
                Active Match
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {donors.map((d) => (
                <DonorCard
                  key={d._id}
                  name={d.name}
                  bloodType={d.bloodType}
                  city={d.city}
                  phone={d.phone}
                  isAvailable={d.isAvailable}
                />
              ))}
            </div>
          </div>
        )}

        {!isLoading && !error && hasSearched && donors.length === 0 && (
          <EmptyState
            icon="🩸"
            title="No donors found"
            message={`We couldn't find any available donors compatible with ${bloodType} ${city ? `in ${city}` : ""}. Try a nearby city or check back later.`}
            actionLabel="Post a Public Request"
            actionHref="/dashboard/request/new"
          />
        )}

        {!hasSearched && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500 shadow-sm">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Ready to search</h3>
            <p className="text-sm max-w-sm mx-auto">
              Select a blood type and optional city above to start matching with emergency donors.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MatchPage() {
  return (
    <Suspense fallback={<div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mt-20" />}>
      <MatchResults />
    </Suspense>
  );
}
