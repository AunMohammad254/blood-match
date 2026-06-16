import React from "react";

export const DonorCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white/95 rounded-3xl border border-gray-100 p-6 shadow-xs flex flex-col justify-between animate-pulse">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gray-200 shrink-0" />
            <div className="space-y-2">
              <div className="h-3 w-16 bg-gray-200 rounded" />
              <div className="h-5 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-xl" />
        </div>
        <div className="mt-8 h-8 w-full bg-gray-100 rounded-full" />
      </div>
      <div className="mt-6 space-y-3">
        <div className="flex gap-2">
          <div className="h-10 flex-1 bg-gray-200 rounded-xl" />
          <div className="h-10 w-16 bg-gray-200 rounded-xl" />
        </div>
        <div className="h-10 w-full bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
};

export const RequestCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white/95 rounded-3xl border border-gray-100 p-7 shadow-xs flex flex-col justify-between animate-pulse">
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-3">
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="h-7 w-48 bg-gray-200 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="w-12 h-12 bg-gray-200 rounded-xl" />
            <div className="w-16 h-6 bg-gray-200 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="h-14 bg-gray-100 rounded-2xl" />
          <div className="h-14 bg-gray-100 rounded-2xl" />
        </div>
        <div className="h-24 bg-gray-100 rounded-2xl" />
      </div>
      <div className="mt-7 flex justify-between">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-8 w-24 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
};
