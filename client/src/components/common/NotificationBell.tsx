"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/hooks/useNotifications";
import { cn, formatDate } from "@/lib/utils";
import { Notification } from "@/types/common";

const TYPE_STYLES: Record<Notification["type"], string> = {
  success: "bg-success-light text-success",
  info: "bg-primary-50 text-primary",
  warning: "bg-warning-light text-warning",
};

const TYPE_DOT: Record<Notification["type"], string> = {
  success: "bg-success",
  info: "bg-primary",
  warning: "bg-warning",
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: notifications = [], isLoading } = useNotifications();
  const { mutate: markAllRead } = useMarkAllNotificationsRead();
  const { mutate: markRead } = useMarkNotificationRead();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const unreadNotifications = notifications.filter((n) => !n.read);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative z-110">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 rounded-lg text-text-secondary hover:bg-border-light transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-1rem)] bg-card border border-border rounded-2xl shadow-modal z-120 overflow-hidden md:right-auto md:left-full md:top-0 md:mt-0 md:ml-3">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <h3 className="font-semibold text-text text-sm">Notifications</h3>
              <p className="text-[11px] text-text-muted mt-0.5">
                {unreadCount} unread
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-border-light">
            {isLoading ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 skeleton rounded-xl" />
                ))}
              </div>
            ) : unreadNotifications.length === 0 ? (
              <div className="py-8 text-center text-text-muted text-sm">
                No unread notifications
              </div>
            ) : (
              unreadNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.read) {
                      markRead(notif.id);
                    }
                  }}
                  className={cn(
                    "px-4 py-3 hover:bg-secondary transition-colors cursor-pointer",
                    !notif.read && "bg-primary-50/40",
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full mt-1.5 shrink-0",
                        TYPE_DOT[notif.type],
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-text line-clamp-1">
                          {notif.title}
                        </p>
                        <span
                          className={cn(
                            "text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap",
                            TYPE_STYLES[notif.type],
                          )}
                        >
                          {notif.type}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        {formatDate(notif.createdAt.split("T")[0])}
                      </p>
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
}
