"use client";

import React, { forwardRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

interface PremiumDatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholderText?: string;
  className?: string;
}

export function PremiumDatePicker({
  selected,
  onChange,
  placeholderText = "Select a date",
  className = "",
}: PremiumDatePickerProps) {
  const CustomInput = forwardRef<HTMLButtonElement, any>(({ value, onClick, placeholder }, ref) => (
    <button
      type="button"
      className={`w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-2 border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 flex items-center justify-between text-left transition-all duration-200 hover:border-red-300 dark:hover:border-red-900/50 focus:ring-2 focus:ring-red-500/50 ${className}`}
      onClick={onClick}
      ref={ref}
    >
      <span className={`block truncate ${!value ? "text-gray-400 dark:text-slate-500" : "text-gray-900 dark:text-white font-bold"}`}>
        {value || placeholder}
      </span>
      <Calendar className="w-4 h-4 text-gray-400" />
    </button>
  ));
  CustomInput.displayName = "CustomInput";

  return (
    <div className="relative w-full">
      <DatePicker
        selected={selected}
        onChange={onChange}
        customInput={<CustomInput placeholder={placeholderText} />}
        dateFormat="MMMM d, yyyy"
        calendarClassName="!bg-white/95 dark:!bg-slate-900/95 !backdrop-blur-xl !border !border-gray-100 dark:!border-slate-800 !rounded-2xl !shadow-2xl !p-2"
        dayClassName={(date) => 
          "!rounded-full hover:!bg-red-100 dark:hover:!bg-red-900/50 hover:!text-red-700 !transition-colors !m-0.5 !w-8 !h-8 !leading-8"
        }
        wrapperClassName="w-full"
      />
      <style dangerouslySetInnerHTML={{__html: `
        .react-datepicker-popper[data-placement^="bottom"] .react-datepicker__triangle {
          fill: theme('colors.white');
          color: theme('colors.gray.100');
        }
        .dark .react-datepicker-popper[data-placement^="bottom"] .react-datepicker__triangle {
          fill: theme('colors.slate.900');
          color: theme('colors.slate.800');
        }
        .react-datepicker__header {
          background-color: transparent !important;
          border-bottom: none !important;
        }
        .react-datepicker__current-month, .react-datepicker-time__header, .react-datepicker-year-header {
          color: theme('colors.gray.900') !important;
          font-weight: 900 !important;
        }
        .dark .react-datepicker__current-month, .dark .react-datepicker-time__header, .dark .react-datepicker-year-header {
          color: theme('colors.white') !important;
        }
        .react-datepicker__day-name, .react-datepicker__day, .react-datepicker__time-name {
          color: theme('colors.gray.600');
          font-weight: 700;
        }
        .dark .react-datepicker__day-name, .dark .react-datepicker__day, .dark .react-datepicker__time-name {
          color: theme('colors.slate.300');
        }
        .react-datepicker__day--selected, .react-datepicker__day--in-selecting-range, .react-datepicker__day--in-range, .react-datepicker__month-text--selected, .react-datepicker__month-text--in-selecting-range, .react-datepicker__month-text--in-range, .react-datepicker__quarter-text--selected, .react-datepicker__quarter-text--in-selecting-range, .react-datepicker__quarter-text--in-range, .react-datepicker__year-text--selected, .react-datepicker__year-text--in-selecting-range, .react-datepicker__year-text--in-range {
          background-color: theme('colors.red.600') !important;
          color: white !important;
          font-weight: 900 !important;
          border-radius: 9999px !important;
        }
        .react-datepicker__day--keyboard-selected {
          background-color: theme('colors.red.100') !important;
          color: theme('colors.red.700') !important;
        }
        .dark .react-datepicker__day--keyboard-selected {
          background-color: theme('colors.red.900') !important;
          color: theme('colors.red.100') !important;
        }
      `}} />
    </div>
  );
}
