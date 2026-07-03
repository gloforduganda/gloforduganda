import { notFound } from "next/navigation";
export const metadata = { title: "Admin", robots: { index: false, follow: false } };

import { requireActorFromSession } from "@/lib/auth-context";
import { getProjectForEdit } from "@/lib/services/projects";
import { ProjectForm } from "../ProjectForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ProjectStatusControl } from "../ProjectStatusControl";

export default async function EditProject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireActorFromSession();
  const project = await getProjectForEdit(id);
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.title}</h1>
          <p className="text-sm text-[var(--color-muted-fg)]">/projects/{project.slug}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={project.status} />
          <ProjectStatusControl id={project.id} status={project.status} />
        </div>
      </header>
      <ProjectForm
        initial={{
          id: project.id,
          slug: project.slug,
          title: project.title,
          summary: project.summary,
          body: (project.body as never) ?? [],
          coverMediaId: project.coverMediaId ?? undefined,
          coverUrl: project.cover?.url ?? null,
          order: project.order,
        }}
      />
    </div>
  );
}
