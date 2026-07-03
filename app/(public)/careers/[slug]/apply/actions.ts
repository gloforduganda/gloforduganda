"use server";

import { headers } from "next/headers";
import { submitApplication, getCareerBySlug } from "@/lib/services/careers";
import { rateLimit } from "@/lib/ratelimit";
import { ValidationError } from "@/lib/errors";
import { saveFile, publicUrlFor } from "@/lib/storage/r2";

const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

async function uploadDocumentField(
  formData: FormData,
  fieldName: string,
  folder: string,
): Promise<string | undefined> {
  const file = formData.get(fieldName);
  if (!file || typeof file === "string" || file.size === 0) return undefined;
  if (!ALLOWED_DOC_TYPES.includes(file.type)) {
    throw new ValidationError(`${fieldName}: unsupported file type (${file.type})`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError(`${fieldName}: file too large (max 10 MB)`);
  }
  const ext = file.name.split(".").pop() ?? "bin";
  const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await saveFile(key, buffer);
  return publicUrlFor(key);
}

export async function submitApplicationAction(formData: FormData) {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown";
  const rl = await rateLimit({ bucket: "career-apply", identifier: ip, limit: 5, windowSeconds: 3600 });
  if (!rl.ok) throw new ValidationError("Too many submissions — please try again later.");

  const slug = formData.get("slug") as string;
  const career = await getCareerBySlug(slug);

  const educationRaw = formData.get("education") as string;
  const experienceRaw = formData.get("experience") as string;
  const customAnswersRaw = formData.get("customAnswers") as string;

  const folder = `applications/${career.id}`;
  const [resumeUrl, coverLetterUrl, idDocumentUrl, photoUrl, portfolioUrl] = await Promise.all([
    uploadDocumentField(formData, "resumeFile", folder),
    uploadDocumentField(formData, "coverLetterFile", folder),
    uploadDocumentField(formData, "idDocumentFile", folder),
    uploadDocumentField(formData, "photoFile", folder),
    uploadDocumentField(formData, "portfolioFile", folder),
  ]);

  await submitApplication({
    careerId: career.id,
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    phone: (formData.get("phone") as string) || undefined,
    nationality: (formData.get("nationality") as string) || undefined,
    address: (formData.get("address") as string) || undefined,
    resumeUrl,
    coverLetterUrl,
    idDocumentUrl,
    photoUrl,
    portfolioUrl,
    linkedinUrl: (formData.get("linkedinUrl") as string) || undefined,
    education: educationRaw ? JSON.parse(educationRaw) : [],
    experience: experienceRaw ? JSON.parse(experienceRaw) : [],
    customAnswers: customAnswersRaw ? JSON.parse(customAnswersRaw) : {},
  });
}
