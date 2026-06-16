import React from "react";
import { Sparkles } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  return (
    <div
      className="flex flex-col items-center justify-center py-24 gap-4 animate-fadeIn"
      role="status"
      aria-label="Loading"
    >
      <div className="relative flex items-center justify-center">
        <div className="absolute w-16 h-16 bg-red-500/10 rounded-full blur-xl animate-pulse" />
        <div className="w-12 h-12 border-4 border-red-100 border-t-red-600 rounded-full animate-spin relative z-10 shadow-xs" />
        <div className="absolute text-xs transform -translate-y-0.5 z-20">🩸</div>
      </div>
      {message && (
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-red-600 animate-spin" />
          <p className="text-xs font-bold text-gray-700 tracking-wide">{message}</p>
        </div>
      )}
    </div>
  );
};
