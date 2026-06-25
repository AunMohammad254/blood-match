"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface Option {
  value: string;
  label: string;
}

interface PremiumSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function PremiumSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = "",
  disabled = false,
}: PremiumSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-2 border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 flex items-center justify-between text-left transition-all duration-200 
        ${isOpen ? "ring-2 ring-red-500/50 border-red-400 dark:border-red-600 shadow-md" : "hover:border-red-300 dark:hover:border-red-900/50"} 
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span className={`block truncate ${!selectedOption ? "text-gray-400 dark:text-slate-500" : "text-gray-900 dark:text-white font-bold"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-red-500" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      <div
        className={`absolute z-50 w-full mt-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-gray-100 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden origin-top transition-all duration-200 ${
          isOpen ? "opacity-100 scale-100 translate-y-0 visible" : "opacity-0 scale-95 -translate-y-2 invisible pointer-events-none"
        }`}
      >
        <div className="max-h-64 overflow-y-auto custom-scrollbar p-1.5">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-left text-sm font-bold transition-all duration-150 ${
                value === option.value
                  ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-750"
              }`}
            >
              <span className="truncate">{option.label}</span>
              {value === option.value && <Check className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
