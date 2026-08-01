"use client";

import React, { forwardRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";

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
  const CustomInput = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { value?: string; placeholder?: string }>(({ value, onClick, placeholder }, ref) => (
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
        calendarClassName="!bg-slate-900 !backdrop-blur-xl !border !border-slate-800 !rounded-2xl !shadow-2xl !p-3"
        dayClassName={() => 
          "!rounded-full hover:!bg-red-600 hover:!text-white !transition-colors !m-0.5 !w-8 !h-8 !leading-8"
        }
        wrapperClassName="w-full"
      />
      <style dangerouslySetInnerHTML={{__html: `
        .react-datepicker {
          background-color: #0f172a !important;
          border-color: #1e293b !important;
          color: #ffffff !important;
          font-family: inherit;
        }
        .react-datepicker-popper[data-placement^="bottom"] .react-datepicker__triangle {
          fill: #0f172a !important;
          color: #0f172a !important;
          stroke: #1e293b !important;
        }
        .react-datepicker__header {
          background-color: transparent !important;
          border-bottom: 1px solid #1e293b !important;
          padding-top: 8px !important;
        }
        .react-datepicker__current-month,
        .react-datepicker-time__header,
        .react-datepicker-year-header {
          color: #ffffff !important;
          font-weight: 800 !important;
          font-size: 0.95rem !important;
          margin-bottom: 8px !important;
        }
        .react-datepicker__day-name {
          color: #cbd5e1 !important;
          font-weight: 700 !important;
          width: 2rem !important;
          line-height: 2rem !important;
          margin: 0.125rem !important;
        }
        .react-datepicker__day,
        .react-datepicker__time-name {
          color: #ffffff !important;
          font-weight: 600 !important;
          width: 2rem !important;
          height: 2rem !important;
          line-height: 2rem !important;
          margin: 0.125rem !important;
        }
        .react-datepicker__day--outside-month {
          color: #64748b !important;
        }
        .react-datepicker__day--selected,
        .react-datepicker__day--in-selecting-range,
        .react-datepicker__day--in-range {
          background-color: #dc2626 !important;
          color: #ffffff !important;
          font-weight: 900 !important;
          border-radius: 9999px !important;
        }
        .react-datepicker__day--keyboard-selected {
          background-color: #991b1b !important;
          color: #ffffff !important;
          border-radius: 9999px !important;
        }
        .react-datepicker__day:hover {
          background-color: #ef4444 !important;
          color: #ffffff !important;
          border-radius: 9999px !important;
        }
        .react-datepicker__navigation-icon::before {
          border-color: #ffffff !important;
          border-width: 2px 2px 0 0 !important;
        }
        .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
          border-color: #ef4444 !important;
        }
      `}} />
    </div>
  );
}
