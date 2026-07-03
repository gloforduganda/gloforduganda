import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Search, FileText, Briefcase, CalendarDays, HelpCircle, Layers } from "lucide-react";
import { searchContent } from "@/lib/search/sync";
import { INDEXES, type SearchDocument } from "@/lib/search/client";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { canonicalAlternates } from "@/lib/seo/json-ld";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { q: rawQ } = await searchParams;
  const q = rawQ?.trim();
  return {
    title: q ? `Search: ${q}` : "Search",
    description: "Search posts, programs, projects, events, careers, and FAQs.",
    alternates: canonicalAlternates("/search"),
  };
}

const TYPE_META: Record<string, { label: string; icon: React.ElementType; hrefPrefix: string }> = {
  [INDEXES.posts]:    { label: "Blog",     icon: FileText,     hrefPrefix: "/blog/" },
  [INDEXES.programs]: { label: "Program",  icon: Layers,       hrefPrefix: "/programs/" },
  [INDEXES.projects]: { label: "Project",  icon: Layers,       hrefPrefix: "/projects/" },
  [INDEXES.events]:   { label: "Event",    icon: CalendarDays, hrefPrefix: "/events/" },
  [INDEXES.careers]:  { label: "Career",   icon: Briefcase,    hrefPrefix: "/careers/" },
  [INDEXES.faqs]:     { label: "FAQ",      icon: HelpCircle,   hrefPrefix: "/#faqs" },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const t = await getTranslations("public.search");
  const { q: rawQ } = await searchParams;
  const q = rawQ?.trim() ?? "";
  const hits: SearchDocument[] = q ? await searchContent(q, { limit: 20 }) : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <ScrollReveal>
        <h1 className="font-display text-3xl font-bold text-[var(--color-fg)] sm:text-4xl">
          {t("heading")}
        </h1>
      </ScrollReveal>

      <form method="GET" action="/search" className="mt-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-muted-fg)]" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={t("placeholder")}
            className="w-full rounded-full border border-[var(--color-input)] bg-[var(--color-bg)] py-3 pl-12 pr-4 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
          />
        </div>
      </form>

      {q && (
        <p className="mt-4 text-sm text-[var(--color-muted-fg)]">
          {hits.length === 0
            ? t("noResults", { q })
            : t("results", { count: hits.length, q })}
        </p>
      )}

      {hits.length > 0 && (
        <ul className="mt-6 space-y-3">
          {hits.map((hit) => {
            const meta = TYPE_META[hit.type];
            const Icon = meta?.icon ?? FileText;
            const href = hit.type === INDEXES.faqs
              ? "/#faqs"
              : `${meta?.hrefPrefix ?? "/"}${hit.slug}`;
            return (
              <li key={hit.id}>
                <ScrollReveal>
                  <Link
                    href={href}
                    className="group flex gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 transition hover:shadow-md hover:border-[rgb(var(--token-primary)/0.30)]"
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--token-primary)/0.10)]">
                      <Icon className="h-4 w-4 text-[var(--color-primary)]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted-fg)]">
                          {meta?.label ?? hit.type}
                        </span>
                      </div>
                      <p
                        className="mt-1 font-semibold text-[var(--color-fg)] group-hover:text-[var(--color-primary)]"
                        dangerouslySetInnerHTML={{ __html: hit.title }}
                      />
                      {hit.excerpt && (
                        <p
                          className="mt-1 line-clamp-2 text-sm text-[var(--color-muted-fg)]"
                          dangerouslySetInnerHTML={{ __html: hit.excerpt }}
                        />
                      )}
                    </div>
                  </Link>
                </ScrollReveal>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
