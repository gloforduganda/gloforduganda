import { db } from "@/lib/db";
import { notifyAdminOfSubmission } from "@/lib/mail/adminNotify";

const ADMIN_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function submitPartnerApplication(data: {
  organizationName: string;
  contactName: string;
  email: string;
  phone?: string;
  website?: string;
  description: string;
  partnershipType: string;
  message?: string;
}) {
  const row = await db.partnerApplication.create({ data });
  void notifyAdminOfSubmission({
    type: "partner_application",
    subject: `New partner application: ${data.organizationName}`,
    details: { Organization: data.organizationName, Contact: data.contactName, Email: data.email, Type: data.partnershipType },
    adminUrl: `${ADMIN_URL}/admin/partner-applications`,
  });
  return row;
}

export async function getAllPartnerApplications() {
  return db.partnerApplication.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function updatePartnerApplicationStatus(
  id: string,
  status: "PENDING" | "APPROVED" | "REJECTED",
  reviewedById?: string,
) {
  return db.partnerApplication.update({
    where: { id },
    data: { status, reviewedById },
  });
}
