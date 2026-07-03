"use client";

import { useState } from "react";
import { Search, RefreshCw, CheckCircle2, AlertCircle, Database } from "lucide-react";
import { Button } from "@/components/ui/Button";

type ReindexResult = {
  ok: boolean;
  indexed?: number;
  breakdown?: Record<string, number>;
  error?: string;
};

export default function SearchSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReindexResult | null>(null);

  const reindex = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/search-reindex", { method: "POST" });
      const data = await res.json() as ReindexResult;
      setResult(data);
    } catch {
      setResult({ ok: false, error: "Network error — could not reach the reindex endpoint." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          Configure Meilisearch and manage the content index.
        </p>
      </header>

      {/* Config status */}
      <section className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">
          <Database className="h-4 w-4" /> Configuration
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-muted)] px-4 py-2.5">
            <span className="font-medium">MEILISEARCH_HOST</span>
            <code className="text-xs text-[var(--color-muted-fg)]">
              Set in .env — e.g. http://localhost:7700
            </code>
          </div>
          <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-muted)] px-4 py-2.5">
            <span className="font-medium">MEILISEARCH_API_KEY</span>
            <code className="text-xs text-[var(--color-muted-fg)]">
              Optional master key for secured instances
            </code>
          </div>
        </div>
        <p className="text-xs text-[var(--color-muted-fg)]">
          Search is optional. When <code>MEILISEARCH_HOST</code> is not set, the public{" "}
          <code>/search</code> page returns no results gracefully. Set it to enable full-text
          search across posts, programs, projects, events, careers, and FAQs.
        </p>
      </section>

      {/* Reindex */}
      <section className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">
          <Search className="h-4 w-4" /> Content Index
        </h2>
        <p className="text-sm text-[var(--color-muted-fg)]">
          Rebuilds the entire search index from the current database. Run this after first
          configuring Meilisearch, or if the index gets out of sync. New content is indexed
          automatically on every publish/update.
        </p>

        {result && (
          <div
            className={`flex items-start gap-3 rounded-[var(--radius-md)] border p-4 text-sm ${
              result.ok
                ? "border-[rgb(var(--token-success)/0.30)] bg-[rgb(var(--token-success)/0.08)] text-[var(--color-success)]"
                : "border-[rgb(var(--token-danger)/0.30)] bg-[rgb(var(--token-danger)/0.08)] text-[var(--color-danger)]"
            }`}
          >
            {result.ok ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <div className="space-y-1">
              {result.ok ? (
                <>
                  <p className="font-medium">Reindex complete — {result.indexed} documents indexed.</p>
                  {result.breakdown && (
                    <ul className="text-xs opacity-80">
                      {Object.entries(result.breakdown).map(([k, v]) => (
                        <li key={k}>{k}: {v}</li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <p className="font-medium">{result.error}</p>
              )}
            </div>
          </div>
        )}

        <Button onClick={reindex} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Indexing…" : "Reindex all content"}
        </Button>
      </section>

      {/* How it works */}
      <section className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">
          What gets indexed
        </h2>
        <ul className="space-y-1.5 text-sm text-[var(--color-muted-fg)]">
          {[
            ["Blog posts", "Published only — title + excerpt"],
            ["Programs", "Published only — title + summary"],
            ["Projects", "Published only — title + summary"],
            ["Events", "Public events — title + description"],
            ["Careers", "Active listings — title + description"],
            ["FAQs", "Active FAQs — question + answer"],
          ].map(([name, desc]) => (
            <li key={name} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
              <span><strong>{name}</strong> — {desc}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
