"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/Select";

const STATUSES = ["PENDING", "SUCCEEDED", "FAILED", "REFUNDED"] as const;
const PROVIDERS = ["STRIPE", "PESAPAL", "MTN_MOMO", "AIRTEL_MONEY"] as const;

const inputCls =
  "rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]";

export function DonationFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [, start] = useTransition();

  const push = (key: string, value: string) => {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    start(() => router.push(`/admin/donations?${params.toString()}`));
  };

  const hasFilters = sp.get("status") || sp.get("provider") || sp.get("from") || sp.get("to") || sp.get("campaign") || sp.get("donor");

  return (
    <div className="flex flex-wrap gap-3">
      <Select value={sp.get("status") ?? ""} onValueChange={(v) => push("status", v === "_all" ? "" : v)}>
        <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All statuses</SelectItem>
          {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={sp.get("provider") ?? ""} onValueChange={(v) => push("provider", v === "_all" ? "" : v)}>
        <SelectTrigger className="w-44"><SelectValue placeholder="All providers" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All providers</SelectItem>
          {PROVIDERS.map((p) => <SelectItem key={p} value={p}>{p.replace(/_/g, " ")}</SelectItem>)}
        </SelectContent>
      </Select>

      <input
        type="date"
        defaultValue={sp.get("from") ?? ""}
        onChange={(e) => push("from", e.target.value)}
        className={inputCls}
        aria-label="From date"
      />
      <input
        type="date"
        defaultValue={sp.get("to") ?? ""}
        onChange={(e) => push("to", e.target.value)}
        className={inputCls}
        aria-label="To date"
      />
      <input
        type="text"
        defaultValue={sp.get("campaign") ?? ""}
        placeholder="Campaign…"
        onBlur={(e) => push("campaign", e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") push("campaign", (e.target as HTMLInputElement).value); }}
        className={inputCls}
      />
      <input
        type="text"
        defaultValue={sp.get("donor") ?? ""}
        placeholder="Donor email/name…"
        onBlur={(e) => push("donor", e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") push("donor", (e.target as HTMLInputElement).value); }}
        className={inputCls}
      />
      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push("/admin/donations")}
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-muted)]"
        >
          Clear
        </button>
      )}
    </div>
  );
}
