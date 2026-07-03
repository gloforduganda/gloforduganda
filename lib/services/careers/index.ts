import { db } from "@/lib/db";
import { revalidateTag, unstable_cache } from "next/cache";
import { notifyAdminOfSubmission } from "@/lib/mail/adminNotify";

const CACHE_TAG = "careers";
const ADMIN_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const getActiveCareers = unstable_cache(
  async () => {
    return db.career.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { applications: true } } },
    });
  },
  ["careers-active"],
  { tags: [CACHE_TAG], revalidate: 3600 },
);

export async function getCareerBySlug(slug: string) {
  return db.career.findUniqueOrThrow({
    where: { slug },
    include: { _count: { select: { applications: true } } },
  });
}

export async function getAllCareers() {
  return db.career.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });
}

export async function createCareer(data: {
  title: string;
  slug: string;
  department: string;
  location: string;
  type?: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "VOLUNTEER";
  description: string;
  requirements?: string[];
  responsibilities?: string[];
  qualifications?: string[];
  benefits?: string[];
  salaryRange?: string;
  applicationDeadline?: Date;
  customFields?: unknown[];
  notificationEmail?: string;
}) {
  const career = await db.career.create({ data: data as never });
  revalidateTag(CACHE_TAG);
  return career;
}

export async function updateCareer(
  id: string,
  data: {
    title?: string;
    slug?: string;
    department?: string;
    location?: string;
    type?: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "VOLUNTEER";
    description?: string;
    requirements?: string[];
    responsibilities?: string[];
    qualifications?: string[];
    benefits?: string[];
    salaryRange?: string | null;
    applicationDeadline?: Date | null;
    isActive?: boolean;
    customFields?: unknown[];
    notificationEmail?: string | null;
  },
) {
  const career = await db.career.update({ where: { id }, data: data as never });
  revalidateTag(CACHE_TAG);
  return career;
}

export async function deleteCareer(id: string) {
  await db.career.delete({ where: { id } });
  revalidateTag(CACHE_TAG);
}

export async function submitApplication(data: {
  careerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  nationality?: string;
  address?: string;
  /** Legacy plain-text cover letter */
  coverLetter?: string;
  /** File URL for uploaded cover letter document */
  coverLetterUrl?: string;
  resumeUrl?: string;
  idDocumentUrl?: string;
  photoUrl?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  education?: Array<{ institution: string; degree: string; field: string; year: string }>;
  experience?: Array<{ company: string; role: string; duration: string; description: string }>;
  customAnswers?: Record<string, string>;
}) {
  const row = await db.careerApplication.create({ data: data as never });
  const career = await db.career.findUnique({
    where: { id: data.careerId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: { title: true, notificationEmail: true } as any,
  }) as { title: string; notificationEmail: string | null } | null;

  const documents: Array<{ label: string; url: string }> = [];
  if (data.resumeUrl) documents.push({ label: "CV / Resume", url: data.resumeUrl });
  if (data.coverLetterUrl) documents.push({ label: "Cover Letter", url: data.coverLetterUrl });
  if (data.idDocumentUrl) documents.push({ label: "ID Document", url: data.idDocumentUrl });
  if (data.photoUrl) documents.push({ label: "Photo", url: data.photoUrl });
  if (data.portfolioUrl) documents.push({ label: "Portfolio", url: data.portfolioUrl });

  void notifyAdminOfSubmission({
    type: "career_application",
    subject: `New application: ${career?.title ?? "Career position"}`,
    applicantName: `${data.firstName} ${data.lastName}`,
    position: career?.title,
    details: {
      Name: `${data.firstName} ${data.lastName}`,
      Email: data.email,
      Phone: data.phone ?? "—",
      Nationality: data.nationality ?? "—",
      LinkedIn: data.linkedinUrl ?? "—",
    },
    documents,
    adminUrl: `${ADMIN_URL}/admin/careers/${data.careerId}/applications`,
    toEmail: career?.notificationEmail ?? undefined,
  });
  return row;
}

export async function getApplicationsForCareer(careerId: string) {
  return db.careerApplication.findMany({
    where: { careerId },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateApplicationStatus(
  id: string,
  status: "SUBMITTED" | "REVIEWING" | "SHORTLISTED" | "INTERVIEW" | "OFFERED" | "REJECTED" | "WITHDRAWN",
  notes?: string,
) {
  return db.careerApplication.update({
    where: { id },
    data: { status, notes },
  });
}
