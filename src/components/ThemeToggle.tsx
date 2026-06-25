"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Wait until mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10 rounded-full" />;
  }

  const isDark = resolvedTheme === "dark";

  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    const nextTheme = isDark ? "light" : "dark";

    // If browser doesn't support View Transitions API, just switch theme normally
    if (!document.startViewTransition) {
      setTheme(nextTheme);
      return;
    }

    // Get click coordinates to start the circle from the exact click location
    const x = event.clientX;
    const y = event.clientY;
    
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      // The callback must update the DOM synchronously (or return a Promise)
      setTheme(nextTheme);
    });

    // Animate the circle clip-path
    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 600,
          easing: "ease-out",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle Dark Mode"
      className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
    >
      <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
        {/* Sun Icon */}
        <Sun
          className={`absolute w-5 h-5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            isDark ? "opacity-0 -translate-y-full rotate-90 scale-50" : "opacity-100 translate-y-0 rotate-0 scale-100"
          }`}
        />
        {/* Moon Icon */}
        <Moon
          className={`absolute w-5 h-5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            isDark ? "opacity-100 translate-y-0 rotate-0 scale-100" : "opacity-0 translate-y-full -rotate-90 scale-50"
          }`}
        />
      </div>
    </button>
  );
}
