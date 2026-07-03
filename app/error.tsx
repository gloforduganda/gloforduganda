"use client";

import { useEffect } from "react";

/**
 * General error boundary for the application.
 * Catches errors in all pages EXCEPT the root layout itself.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AppError:boundary]", error);
    
    // Best-effort: if Sentry is configured it'll already have been
    // captured by the server runtime; this fires a client-side event
    // too so client-only crashes aren't lost.
    void fetch("/api/client-error", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        digest: error.digest,
        stack: error.stack,
      }),
    }).catch(() => {
      /* swallow — never let error reporting error */
    });
  }, [error]);

  return (
    <main className="grid min-h-[70dvh] place-items-center px-4">
      <div className="max-w-md space-y-3 text-center">
        <div className="flex justify-center pb-2">
          <div className="rounded-full bg-[var(--color-danger)]/10 p-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-danger)]">Error</p>
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Something went wrong</h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          The application encountered an unexpected error. The technical team has been notified.
        </p>
        {error.digest ? (
          <p className="rounded bg-[var(--color-muted)] p-2 text-[10px] font-mono text-[var(--color-muted-fg)]">ID: {error.digest}</p>
        ) : null}
        <button
          onClick={reset}
          className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-fg)]"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
