"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { applyResetAction } from "../actions";

export function ResetConfirmForm({ token }: { token: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(fd: FormData) {
    setError(null);
    start(async () => {
      const result = await applyResetAction(token, fd);
      if (result.ok) {
        router.push("/login?reset=1");
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <p role="alert" className="rounded-lg bg-[rgb(var(--token-danger)/0.10)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">New password</span>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--token-primary)/0.20)]"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Confirm password</span>
        <input
          type="password"
          name="confirm"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Repeat password"
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--token-primary)/0.20)]"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}
