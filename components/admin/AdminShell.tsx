"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export type AdminUser = {
  name: string;
  email: string;
  image: string | null;
  role: string;
};

export function AdminShell({
  user,
  logoUrl,
  siteName,
  children,
}: {
  user: AdminUser;
  logoUrl: string;
  siteName: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-[100dvh] bg-[var(--color-surface-2)]">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        logoUrl={logoUrl}
        siteName={siteName}
      />
      <div className="flex min-w-0 flex-1 flex-col max-md:!pl-0 md:pl-[260px]">
        <Topbar user={user} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1200px] min-w-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
