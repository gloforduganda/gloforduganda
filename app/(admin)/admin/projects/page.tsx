import Link from "next/link";
import { Plus } from "lucide-react";
import { requireActorFromSession } from "@/lib/auth-context";
import { listProjects } from "@/lib/services/projects";
import { Button } from "@/components/ui/Button";
import { ProjectListClient } from "./ProjectListClient";
import type { Project } from "@prisma/client";

export const metadata = { title: "Projects", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ProjectsListPage() {
  await requireActorFromSession();
  const rows = await listProjects();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-[var(--color-muted-fg)]">Ongoing and completed projects your organization runs.</p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/projects/new">
            <Plus className="h-4 w-4" /> New project
          </Link>
        </Button>
      </header>

      <ProjectListClient data={rows as Project[]} />
    </div>
  );
}
