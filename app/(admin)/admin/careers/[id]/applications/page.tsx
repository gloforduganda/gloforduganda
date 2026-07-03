import { requireActorFromSession } from "@/lib/auth-context";
import { getApplicationsForCareer } from "@/lib/services/careers";
import { db } from "@/lib/db";
import { ApplicationsClient } from "./ApplicationsClient";

export const metadata = { title: "Career Applications", robots: { index: false, follow: false } };

export default async function CareerApplicationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireActorFromSession();
  const { id } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const career = await (db.career as any).findUniqueOrThrow({
    where: { id },
    select: { id: true, title: true, customFields: true },
  }) as { id: string; title: string; customFields: unknown };

  const applications = await getApplicationsForCareer(id);
  type CustomField = { id: string; label: string; type: string; required: boolean };
  return (
    <ApplicationsClient
      career={{ id: career.id, title: career.title }}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      applications={applications as any}
      customFields={(career.customFields as CustomField[]) ?? []}
    />
  );
}
