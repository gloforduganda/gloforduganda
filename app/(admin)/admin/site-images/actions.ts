"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import { upsertSiteImage, deleteSiteImage } from "@/lib/services/siteImages";
import {
  parseFormData,
  upsertSiteImageSchema,
  deleteSchema,
} from "@/lib/validators/admin";

export async function upsertSiteImageAction(formData: FormData) {
  await requireActorFromSession();
  const data = parseFormData(upsertSiteImageSchema, formData);
  await upsertSiteImage(data);
  revalidatePath("/admin/site-images");
  revalidatePath("/who-we-are", "page");
  revalidatePath("/history", "page");
  revalidatePath("/our-history", "page");
  revalidatePath("/", "page");
}

export async function deleteSiteImageAction(formData: FormData) {
  await requireActorFromSession();
  const { id } = parseFormData(deleteSchema, formData);
  await deleteSiteImage(id);
  revalidatePath("/admin/site-images");
  revalidatePath("/who-we-are", "page");
  revalidatePath("/history", "page");
  revalidatePath("/our-history", "page");
  revalidatePath("/", "page");
}
