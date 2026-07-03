import { requireActorFromSession } from "@/lib/auth-context";
import { getAllTeamMembers } from "@/lib/services/teamMembers";
import { TeamMemberClient } from "./TeamMemberClient";

export const metadata = { title: "Team Members", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function TeamAdminPage() {
  await requireActorFromSession();
  const members = await getAllTeamMembers();

  return (
    <TeamMemberClient
      members={members.map((m) => ({
        ...m,
        socialLinks: (m.socialLinks ?? {}) as Record<string, string>,
      }))}
    />
  );
}
