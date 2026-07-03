"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";

export function AuditModuleFilter({ modules, current }: { modules: string[]; current: string }) {
  const router = useRouter();
  const params = useSearchParams();

  function onChange(value: string) {
    const p = new URLSearchParams(params.toString());
    if (value) p.set("module", value);
    else p.delete("module");
    p.delete("cursor");
    router.push(`/admin/system/audit?${p.toString()}`);
  }

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger className="w-40" aria-label="Filter by module">
        <SelectValue placeholder="All" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">All</SelectItem>
        {modules.map((m) => (
          <SelectItem key={m} value={m}>{m}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
