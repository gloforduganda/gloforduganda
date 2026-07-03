import { db } from "@/lib/db";
import { notifyAdminOfSubmission } from "@/lib/mail/adminNotify";

const ADMIN_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function createContactMessage(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const row = await db.contactMessage.create({ data });
  void notifyAdminOfSubmission({
    type: "contact",
    subject: `New contact message: ${data.subject}`,
    details: { From: data.name, Email: data.email, Subject: data.subject },
    adminUrl: `${ADMIN_URL}/admin/contact-messages`,
  });
  return row;
}

export async function getAllContactMessages({ page = 1, perPage = 50 }: { page?: number; perPage?: number } = {}) {
  const [rows, total] = await Promise.all([
    db.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.contactMessage.count(),
  ]);
  return { rows, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

export async function markMessageRead(id: string) {
  return db.contactMessage.update({
    where: { id },
    data: { isRead: true },
  });
}

export async function deleteContactMessage(id: string) {
  return db.contactMessage.delete({ where: { id } });
}
