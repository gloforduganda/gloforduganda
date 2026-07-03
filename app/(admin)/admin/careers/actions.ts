"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import { createCareer, updateCareer, deleteCareer, updateApplicationStatus } from "@/lib/services/careers";
import { parseFormData, createCareerSchema, updateCareerSchema, toggleSchema, deleteSchema, updateCareerAppStatusSchema } from "@/lib/validators/admin";
import { upsertDocuments, deleteDocument, careerToDoc } from "@/lib/search/sync";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").trim();
}

function parseCustomFields(formData: FormData) {
  const raw = formData.get("customFields");
  if (!raw || typeof raw !== "string") return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export async function createCareerAction(formData: FormData) {
  await requireActorFromSession();
  const data = parseFormData(createCareerSchema, formData);
  const career = await createCareer({
    title: data.title,
    slug: slugify(data.title),
    department: data.department,
    location: data.location,
    type: data.type as "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "VOLUNTEER",
    description: data.description,
    salaryRange: data.salaryRange ?? undefined,
    applicationDeadline: data.applicationDeadline ?? undefined,
    requirements: data.requirements,
    responsibilities: data.responsibilities,
    customFields: parseCustomFields(formData),
    notificationEmail: (formData.get("notificationEmail") as string) || undefined,
  });
  revalidatePath("/admin/careers");
  revalidatePath("/careers", "page");
  revalidatePath("/careers/[slug]", "page");
  void upsertDocuments([careerToDoc(career)]).catch(() => {});
}

export async function updateCareerAction(formData: FormData) {
  await requireActorFromSession();
  const data = parseFormData(updateCareerSchema, formData);
  const career = await updateCareer(data.id, {
    title: data.title,
    slug: slugify(data.title),
    department: data.department,
    location: data.location,
    type: data.type as "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "VOLUNTEER",
    description: data.description,
    salaryRange: data.salaryRange,
    applicationDeadline: data.applicationDeadline,
    requirements: data.requirements,
    responsibilities: data.responsibilities,
    isActive: data.isActive,
    customFields: parseCustomFields(formData),
    notificationEmail: (formData.get("notificationEmail") as string) || null,
  });
  revalidatePath("/admin/careers");
  revalidatePath("/careers", "page");
  revalidatePath("/careers/[slug]", "page");
  if (career.isActive) {
    void upsertDocuments([careerToDoc(career)]).catch(() => {});
  } else {
    void deleteDocument(`careers:${career.id}`).catch(() => {});
  }
}

export async function deleteCareerAction(formData: FormData) {
  await requireActorFromSession();
  const { id } = parseFormData(deleteSchema, formData);
  await deleteCareer(id);
  revalidatePath("/admin/careers");
  revalidatePath("/careers", "page");
  revalidatePath("/careers/[slug]", "page");
  void deleteDocument(`careers:${id}`).catch(() => {});
}

export async function toggleCareerAction(formData: FormData) {
  await requireActorFromSession();
  const { id, isActive } = parseFormData(toggleSchema, formData);
  const career = await updateCareer(id, { isActive: !isActive });
  revalidatePath("/admin/careers");
  revalidatePath("/careers", "page");
  revalidatePath("/careers/[slug]", "page");
  if (career.isActive) {
    void upsertDocuments([careerToDoc(career)]).catch(() => {});
  } else {
    void deleteDocument(`careers:${career.id}`).catch(() => {});
  }
}

export async function updateApplicationStatusAction(formData: FormData) {
  await requireActorFromSession();
  const data = parseFormData(updateCareerAppStatusSchema, formData);
  await updateApplicationStatus(data.id, data.status, data.notes ?? undefined);
  revalidatePath("/admin/careers");
}
