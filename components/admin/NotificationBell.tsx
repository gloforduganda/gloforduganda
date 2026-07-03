"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

interface NotificationItem {
  label: string;
  href: string;
  count: number;
}

interface NotificationsResponse {
  total: number;
  items: NotificationItem[];
}

const POLL_INTERVAL = 60_000; // 1 minute

export function NotificationBell() {
  const [data, setData] = useState<NotificationsResponse | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = () => {
    fetch("/api/admin/notifications")
      .then((r) => r.json())
      .then((d: NotificationsResponse) => setData(d))
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const total = data?.total ?? 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${total > 0 ? ` (${total} unread)` : ""}`}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-muted-fg)] transition hover:bg-[var(--color-muted)] hover:text-[var(--color-fg)]"
      >
        <Bell className="h-[18px] w-[18px]" />
        {total > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-danger)] text-[9px] font-bold text-white">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-72 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg shadow-black/[0.08]">
          <div className="border-b border-[var(--color-border)] px-4 py-2.5">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">
              Notifications
            </p>
          </div>
          {!data || data.items.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-[var(--color-muted-fg)]">
              All caught up!
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {data.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-[13px] text-[var(--color-fg)] transition-colors hover:bg-[var(--color-muted)]"
                  >
                    <span>{item.label}</span>
                    <span className="shrink-0 rounded-full bg-[rgb(var(--token-danger)/0.12)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-danger)]">
                      {item.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
