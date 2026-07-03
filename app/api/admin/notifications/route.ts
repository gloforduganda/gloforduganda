import { NextResponse } from "next/server";
import { requireActorFromSession } from "@/lib/auth-context";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireActorFromSession();

  const [contactMessages, careerApplications, volunteerApplications, partnerApplications] =
    await Promise.all([
      db.contactMessage.count({ where: { isRead: false, deletedAt: null } }),
      db.careerApplication.count({ where: { status: "SUBMITTED" } }),
      db.volunteerApplication.count({ where: { status: "SUBMITTED" } }),
      db.partnerApplication.count({ where: { status: "PENDING" } }),
    ]);

  const items = [
    ...(contactMessages > 0
      ? [{ label: `${contactMessages} unread contact message${contactMessages > 1 ? "s" : ""}`, href: "/admin/contact-messages", count: contactMessages }]
      : []),
    ...(careerApplications > 0
      ? [{ label: `${careerApplications} new career application${careerApplications > 1 ? "s" : ""}`, href: "/admin/careers", count: careerApplications }]
      : []),
    ...(volunteerApplications > 0
      ? [{ label: `${volunteerApplications} new volunteer application${volunteerApplications > 1 ? "s" : ""}`, href: "/admin/volunteer", count: volunteerApplications }]
      : []),
    ...(partnerApplications > 0
      ? [{ label: `${partnerApplications} new partner application${partnerApplications > 1 ? "s" : ""}`, href: "/admin/partner-applications", count: partnerApplications }]
      : []),
  ];

  return NextResponse.json({
    total: contactMessages + careerApplications + volunteerApplications + partnerApplications,
    items,
  });
}
