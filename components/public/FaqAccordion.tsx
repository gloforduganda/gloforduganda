"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type FaqItem = { id: string; question: string; answer: string };

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {items.map((faq) => {
        const isOpen = open === faq.id;
        return (
          <div
            key={faq.id}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] transition-shadow hover:shadow-sm"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : faq.id)}
              aria-expanded={isOpen}
              className="flex w-full cursor-pointer items-center justify-between p-6 text-left font-semibold text-[var(--color-fg)]"
            >
              <span>{faq.question}</span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-[var(--color-muted-fg)] transition-transform duration-200",
                  isOpen && "rotate-180",
                )}
              />
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-200",
                isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0",
              )}
            >
              <p className="px-6 pb-6 text-sm leading-relaxed text-[var(--color-muted-fg)]">
                {faq.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
