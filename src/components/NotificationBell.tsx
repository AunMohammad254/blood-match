import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, Info } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface Notification {
  _id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

import { getToken } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = async () => {
    const token = getToken();
    if (!token) return; // Don't fetch if not logged in
    
    try {
      const res = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err: any) {
      logger.error("Failed to fetch notifications");
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    setLoading(true);
    try {
      const token = getToken();
      if (!token) return;
      await fetch("/api/notifications", { 
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err: any) {
      logger.error("Failed to mark all as read");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-2xl rounded-2xl z-50 animate-fadeIn">
          <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800 p-3.5 flex items-center justify-between z-10">
            <h3 className="text-sm font-black text-gray-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="text-[10px] font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1 transition"
              >
                <Check className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-50 dark:divide-slate-800/50">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs font-semibold">No notifications yet.</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif._id} className={`p-4 transition-colors ${notif.isRead ? "opacity-70 bg-transparent" : "bg-red-50/50 dark:bg-red-950/10"}`}>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                      <Info className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-slate-200">{notif.message}</p>
                      <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-500 mt-1">{formatRelativeTime(notif.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
