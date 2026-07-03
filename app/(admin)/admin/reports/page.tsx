import { requireActorFromSession } from "@/lib/auth-context";
import { listPagesByCollection } from "@/lib/services/pages";
import { CuratedPageCollectionTable } from "@/components/admin/CuratedPageCollectionTable";

export const metadata = { title: "Reports", robots: { index: false, follow: false } };

export default async function ReportsAdminPage() {
  await requireActorFromSession();
  const rows = await listPagesByCollection("report");

  return (
    <CuratedPageCollectionTable
      title="Reports & Accountability"
      description="Manage annual reports, accountability updates, and transparency pages."
      createHref="/admin/reports/new"
      rows={rows}
    />
  );
}
