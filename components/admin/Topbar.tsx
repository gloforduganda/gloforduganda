"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, ChevronDown, User, LogOut, ExternalLink } from "lucide-react";
import { signOutAction } from "./actions";
import { NotificationBell } from "./NotificationBell";
import type { AdminUser } from "./AdminShell";

export function Topbar({
  user,
  onMenuClick,
}: {
  user: AdminUser;
  onMenuClick: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-[56px] items-center justify-between border-b border-[var(--color-border)] bg-[rgb(var(--token-bg)/0.85)] px-4 backdrop-blur-xl sm:px-6">
      {/* Mobile menu trigger */}
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-muted-fg)] transition hover:bg-[var(--color-muted)] hover:text-[var(--color-fg)] md:hidden"
      >
        <Menu className="h-[18px] w-[18px]" />
      </button>

      {/* Spacer on desktop */}
      <div className="hidden md:block" />

      <div className="flex items-center gap-1">
        <NotificationBell />

      {/* Profile dropdown */}
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-[var(--color-muted)]"
          aria-expanded={open}
          aria-haspopup="true"
        >
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt=""
              className="h-8 w-8 rounded-full object-cover ring-2 ring-[rgb(var(--token-primary)/0.15)]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              aria-hidden="true"
              className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-primary)] text-[11px] font-bold text-white"
            >
              {user.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="hidden text-left sm:block">
            <p className="text-[13px] font-medium leading-none text-[var(--color-fg)]">
              {user.name}
            </p>
            <p className="mt-0.5 text-[11px] leading-none text-[var(--color-muted-fg)]">
              {user.role?.replace(/_/g, " ").toLowerCase()}
            </p>
          </div>
          <ChevronDown
            className={`hidden h-3.5 w-3.5 text-[var(--color-muted-fg)] transition-transform sm:block ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg shadow-black/[0.08]">
            {/* User info */}
            <div className="border-b border-[var(--color-border)] px-4 py-3">
              <p className="text-[13px] font-medium text-[var(--color-fg)]">{user.name}</p>
              <p className="mt-0.5 text-[11px] text-[var(--color-muted-fg)]">{user.email}</p>
            </div>
            {/* Links */}
            <div className="py-1">
              <button
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-[var(--color-fg)] transition-colors hover:bg-[var(--color-muted)]"
              >
                <User className="h-3.5 w-3.5 text-[var(--color-muted-fg)]" />
                Profile
              </button>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-[var(--color-fg)] transition-colors hover:bg-[var(--color-muted)]"
              >
                <ExternalLink className="h-3.5 w-3.5 text-[var(--color-muted-fg)]" />
                View site
              </a>
            </div>
            {/* Sign out */}
            <div className="border-t border-[var(--color-border)] py-1">
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-[var(--color-danger)] transition-colors hover:bg-[rgb(var(--token-danger)/0.06)]"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
      </div>
    </header>
  );
}
