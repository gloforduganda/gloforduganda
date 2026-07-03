"use server";

import { requestPasswordReset, applyPasswordReset } from "@/lib/services/passwordReset";
import { rateLimit } from "@/lib/ratelimit";
import { headers } from "next/headers";

export async function requestResetAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  if (!email) return { ok: false, error: "Email is required." };

  // Rate limit: 5 requests per 15 minutes per IP
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown";
  const rl = await rateLimit({ bucket: "password-reset-request", identifier: ip, limit: 5, windowSeconds: 15 * 60, failOpen: false });
  if (!rl.ok) return { ok: false, error: "Too many requests. Please wait 15 minutes." };

  await requestPasswordReset(email);
  // Always return ok — don't reveal whether the email exists
  return { ok: true };
}

export async function applyResetAction(
  token: string,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password !== confirm) return { ok: false, error: "Passwords do not match." };
  try {
    await applyPasswordReset(token, password);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong." };
  }
}
