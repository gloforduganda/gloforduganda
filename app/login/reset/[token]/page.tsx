import Link from "next/link";
import { validateResetToken } from "@/lib/services/passwordReset";
import { ResetConfirmForm } from "./ResetConfirmForm";

export const metadata = { title: "Set new password" };

export default async function ResetConfirmPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let valid = false;
  let tokenError: string | null = null;
  try {
    await validateResetToken(token);
    valid = true;
  } catch (e) {
    tokenError = e instanceof Error ? e.message : "Invalid link.";
  }

  if (!valid) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--color-bg)] p-6">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Link expired</h1>
          <p className="text-sm text-[var(--color-muted-fg)]">{tokenError}</p>
          <Link
            href="/login/reset"
            className="inline-block rounded-lg bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-white hover:brightness-110"
          >
            Request a new link
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--color-bg)] p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Set new password</h1>
          <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
            Choose a strong password of at least 8 characters.
          </p>
        </div>
        <ResetConfirmForm token={token} />
      </div>
    </main>
  );
}
