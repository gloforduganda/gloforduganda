"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { Globe } from "lucide-react";
import { locales, LOCALE_LABELS, type Locale } from "@/lib/i18n/config";
import { setLocaleAction } from "@/lib/actions/locale";
import { cn } from "@/lib/utils/cn";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/Select";

export function LocaleSwitcher({ className }: { className?: string }) {
  const current = useLocale() as Locale;
  const [pending, start] = useTransition();
  return (
    <div className={cn("inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-fg)]", className)}>
      <Globe className="h-4 w-4 shrink-0" aria-hidden="true" />
      <Select
        value={current}
        disabled={pending}
        onValueChange={(next) => start(() => setLocaleAction(next))}
      >
        <SelectTrigger className="h-8 w-auto gap-1 border-none bg-transparent px-1 shadow-none focus:ring-0" aria-label="Language">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {locales.map((l) => (
            <SelectItem key={l} value={l}>
              {LOCALE_LABELS[l]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
