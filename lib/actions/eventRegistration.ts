"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { registerForEvent, cancelRegistration } from "@/lib/services/events/registration";
import { rateLimit } from "@/lib/ratelimit";
import { ValidationError } from "@/lib/errors";

export async function registerForEventAction(input: {
  eventId: string;
  email: string;
  name?: string;
}) {
  if (!input.eventId || !input.email) {
    throw new Error("Event ID and email are required");
  }
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown";
  const rl = await rateLimit({ bucket: "event-register", identifier: `${ip}:${input.eventId}`, limit: 3, windowSeconds: 3600 });
  if (!rl.ok) throw new ValidationError("Too many registration attempts — please try again later.");

  const reg = await registerForEvent(input);
  revalidatePath(`/events`);
  return { ok: true, status: reg.status };
}

export async function cancelRegistrationAction(input: {
  eventId: string;
  email: string;
}) {
  if (!input.eventId || !input.email) {
    throw new Error("Event ID and email are required");
  }
  await cancelRegistration(input.eventId, input.email);
  revalidatePath(`/events`);
  return { ok: true };
}
