import { requireActorFromSession } from "@/lib/auth-context";
import { getAllSiteStats } from "@/lib/services/siteStats";
import { SiteStatsClient } from "./SiteStatsClient";

export const metadata = { title: "Site Statistics", robots: { index: false, follow: false } };

export default async function SiteStatsAdminPage() {
  await requireActorFromSession();
  const stats = await getAllSiteStats();
  return <SiteStatsClient stats={stats} />;
}
