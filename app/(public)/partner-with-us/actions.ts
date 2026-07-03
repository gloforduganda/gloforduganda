"use server";

import { headers } from "next/headers";
import { submitPartnerApplication } from "@/lib/services/partnerApplications";
import { rateLimit } from "@/lib/ratelimit";
import { ValidationError } from "@/lib/errors";

export async function submitPartnerInquiryAction(formData: FormData) {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown";
  const rl = await rateLimit({ bucket: "partner-inquiry", identifier: ip, limit: 3, windowSeconds: 3600 });
  if (!rl.ok) throw new ValidationError("Too many submissions — please try again later.");

  await submitPartnerApplication({
    organizationName: formData.get("organizationName") as string,
    contactName: formData.get("contactName") as string,
    email: formData.get("email") as string,
    phone: (formData.get("phone") as string) || undefined,
    website: (formData.get("website") as string) || undefined,
    description: formData.get("description") as string,
    partnershipType: formData.get("partnershipType") as string,
    message: (formData.get("message") as string) || undefined,
  });
}
