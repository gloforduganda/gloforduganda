import { requireActorFromSession } from "@/lib/auth-context";
import { getAllCareers } from "@/lib/services/careers";
import { CareersClient } from "./CareersClient";

export const metadata = { title: "Careers", robots: { index: false, follow: false } };

export default async function CareersAdminPage() {
  await requireActorFromSession();
  const careers = await getAllCareers();
  const serialized = careers.map((c) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = c as any;
    return {
      ...c,
      requirements: (c.requirements as string[]) ?? [],
      responsibilities: (c.responsibilities as string[]) ?? [],
      qualifications: (c.qualifications as string[]) ?? [],
      benefits: (c.benefits as string[]) ?? [],
      customFields: (row.customFields as unknown[]) ?? [],
      notificationEmail: (row.notificationEmail as string | null) ?? null,
    };
  });
  return <CareersClient careers={serialized as Parameters<typeof CareersClient>[0]["careers"]} />;
}
