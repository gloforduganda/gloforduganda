"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { requestResetAction } from "./actions";

export default function ResetRequestPage() {
  const [pending, start] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(fd: FormData) {
    setError(null);
    start(async () => {
      const result = await requestResetAction(fd);
      if (result.ok) {
        setSent(true);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--color-bg)] p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
          <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
            Enter your email and we&apos;ll send a reset link.
          </p>
        </div>

        {sent ? (
          <div className="rounded-lg bg-[rgb(var(--token-success)/0.10)] px-4 py-3 text-sm text-[var(--color-success)]">
            If that email is registered, a reset link is on its way. Check your inbox.
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            {error && (
              <p role="alert" className="rounded-lg bg-[rgb(var(--token-danger)/0.10)] px-3 py-2 text-sm text-[var(--color-danger)]">
                {error}
              </p>
            )}
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Email address</span>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--token-primary)/0.20)]"
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {pending ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="text-center text-sm">
          <Link href="/login" className="font-medium text-[var(--color-primary)] hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
