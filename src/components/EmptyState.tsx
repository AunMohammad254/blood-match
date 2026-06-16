import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  actionOnClick?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "🩸",
  title,
  message,
  actionLabel,
  actionHref,
  actionOnClick,
}) => {
  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-gray-100/80 p-14 text-center shadow-xs hover:shadow-md transition-all duration-300 max-w-lg mx-auto flex flex-col items-center relative overflow-hidden group">
      
      {/* Subtle Ambient Accents */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors pointer-events-none" />

      <div className="w-20 h-20 mb-6 rounded-3xl bg-gradient-to-br from-red-50 to-gray-50 border border-red-100/60 flex items-center justify-center text-5xl shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" aria-hidden="true">
        {icon}
      </div>

      <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">{title}</h3>
      <p className="text-xs text-gray-500 max-w-sm mb-8 leading-relaxed font-medium">
        {message}
      </p>

      {actionHref && (
        <Link
          href={actionHref}
          className="btn-primary py-3.5 px-8 text-xs font-black tracking-wider uppercase"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{actionLabel || "Get Started"}</span>
        </Link>
      )}

      {!actionHref && actionOnClick && actionLabel && (
        <button
          onClick={actionOnClick}
          className="btn-primary py-3.5 px-8 text-xs font-black tracking-wider uppercase"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
