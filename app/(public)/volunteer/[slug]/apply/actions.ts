"use server";

import { headers } from "next/headers";
import { submitVolunteerApplication } from "@/lib/services/volunteer";
import { rateLimit } from "@/lib/ratelimit";
import { ValidationError } from "@/lib/errors";

export async function submitVolunteerApplicationAction(formData: FormData) {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown";
  const rl = await rateLimit({ bucket: "volunteer-apply", identifier: ip, limit: 5, windowSeconds: 3600 });
  if (!rl.ok) throw new ValidationError("Too many submissions — please try again later.");

  const skillsRaw = (formData.get("skills") as string) || "";
  const skills = skillsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  await submitVolunteerApplication({
    opportunityId: formData.get("opportunityId") as string,
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    phone: (formData.get("phone") as string) || undefined,
    motivation: formData.get("motivation") as string | undefined,
    availability: formData.get("availability") as string | undefined,
    skills,
  });
}
