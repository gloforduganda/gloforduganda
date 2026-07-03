"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";

const STATUSES = ["PENDING", "RETRIED", "RESOLVED", "IGNORED"] as const;

export function DeadLetterStatusFilter({ current }: { current: string }) {
  const router = useRouter();
  const params = useSearchParams();

  function onChange(value: string) {
    const p = new URLSearchParams(params.toString());
    if (value) p.set("status", value);
    else p.delete("status");
    p.delete("cursor");
    router.push(`/admin/system/dead-letter?${p.toString()}`);
  }

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger className="w-36" aria-label="Filter by status">
        <SelectValue placeholder="All" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">All</SelectItem>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
