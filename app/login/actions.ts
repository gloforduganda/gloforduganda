"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";
import { headers } from "next/headers";

function safeAdminNext(value: string) {
  if (!value.startsWith("/admin")) return "/admin/dashboard";
  if (value.startsWith("//")) return "/admin/dashboard";
  return value;
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const requestedNext = String(formData.get("next") ?? "/admin/dashboard");
  const next = safeAdminNext(requestedNext);

  // Rate limit: 10 attempts per 15 minutes per IP
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown";
  const rl = await rateLimit({
    bucket: "login",
    identifier: ip,
    limit: 10,
    windowSeconds: 15 * 60,
    failOpen: false,
  });
  if (!rl.ok) {
    redirect(`/login?error=rate_limit&next=${encodeURIComponent(next)}`);
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (e) {
    if (e instanceof AuthError) {
      redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
    }
    throw e;
  }
  redirect(next);
}
