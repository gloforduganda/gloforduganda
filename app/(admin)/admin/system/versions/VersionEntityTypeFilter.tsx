"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";

export function VersionEntityTypeFilter({ entityTypes, current }: { entityTypes: string[]; current: string }) {
  const router = useRouter();
  const params = useSearchParams();

  function onChange(value: string) {
    const p = new URLSearchParams(params.toString());
    if (value) p.set("entityType", value);
    else p.delete("entityType");
    p.delete("cursor");
    router.push(`/admin/system/versions?${p.toString()}`);
  }

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger className="w-44" aria-label="Filter by entity type">
        <SelectValue placeholder="All" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">All</SelectItem>
        {entityTypes.map((t) => (
          <SelectItem key={t} value={t}>{t}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
