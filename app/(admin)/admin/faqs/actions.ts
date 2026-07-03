"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import { createFaq, updateFaq, deleteFaq } from "@/lib/services/faqs";
import { parseFormData, createFaqSchema, updateFaqSchema, toggleSchema, deleteSchema } from "@/lib/validators/admin";
import { upsertDocuments, deleteDocument, faqToDoc } from "@/lib/search/sync";

export async function createFaqAction(formData: FormData) {
  await requireActorFromSession();
  const data = parseFormData(createFaqSchema, formData);
  const faq = await createFaq(data);
  revalidatePath("/admin/faqs");
  revalidatePath("/partners", "page");
  revalidatePath("/get-involved", "page");
  revalidatePath("/", "page");
  void upsertDocuments([faqToDoc(faq)]).catch(() => {});
}

export async function updateFaqAction(formData: FormData) {
  await requireActorFromSession();
  const { id, ...rest } = parseFormData(updateFaqSchema, formData);
  const faq = await updateFaq(id, rest);
  revalidatePath("/admin/faqs");
  revalidatePath("/partners", "page");
  revalidatePath("/get-involved", "page");
  revalidatePath("/", "page");
  if (faq.isActive) {
    void upsertDocuments([faqToDoc(faq)]).catch(() => {});
  } else {
    void deleteDocument(`faqs:${faq.id}`).catch(() => {});
  }
}

export async function deleteFaqAction(formData: FormData) {
  await requireActorFromSession();
  const { id } = parseFormData(deleteSchema, formData);
  await deleteFaq(id);
  revalidatePath("/admin/faqs");
  revalidatePath("/partners", "page");
  revalidatePath("/get-involved", "page");
  revalidatePath("/", "page");
  void deleteDocument(`faqs:${id}`).catch(() => {});
}

export async function toggleFaqAction(formData: FormData) {
  await requireActorFromSession();
  const { id, isActive } = parseFormData(toggleSchema, formData);
  const faq = await updateFaq(id, { isActive: !isActive });
  revalidatePath("/admin/faqs");
  revalidatePath("/partners", "page");
  revalidatePath("/get-involved", "page");
  revalidatePath("/", "page");
  if (faq.isActive) {
    void upsertDocuments([faqToDoc(faq)]).catch(() => {});
  } else {
    void deleteDocument(`faqs:${faq.id}`).catch(() => {});
  }
}
