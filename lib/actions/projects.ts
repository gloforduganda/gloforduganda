"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActorFromSession } from "@/lib/auth-context";
import { createProject, updateProject, setProjectStatus, deleteProject } from "@/lib/services/projects";
import { upsertDocuments, deleteDocument, projectToDoc } from "@/lib/search/sync";
import { db } from "@/lib/db";

export async function createProjectAction(raw: unknown) {
  const actor = await requireActorFromSession();
  const row = await createProject(actor, raw);
  revalidatePath("/admin/projects");
  revalidatePath("/projects", "page");
  void upsertDocuments([projectToDoc(row)]).catch(() => {});
  redirect(`/admin/projects/${row.id}`);
}

export async function updateProjectAction(raw: unknown) {
  const actor = await requireActorFromSession();
  const row = await updateProject(actor, raw);
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${row.id}`);
  revalidatePath("/projects", "page");
  revalidatePath(`/projects/${row.slug}`, "page");
  void upsertDocuments([projectToDoc(row)]).catch(() => {});
}

export async function setProjectStatusAction(raw: unknown) {
  const actor = await requireActorFromSession();
  const row = await setProjectStatus(actor, raw);
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${row.id}`);
  revalidatePath("/projects", "page");
  revalidatePath(`/projects/${row.slug}`, "page");
  if (row.status === "PUBLISHED") {
    void upsertDocuments([projectToDoc(row)]).catch(() => {});
  } else {
    void deleteDocument(`projects:${row.id}`).catch(() => {});
  }
}

export async function deleteProjectAction(raw: unknown) {
  const actor = await requireActorFromSession();
  const proj = await db.project.findUnique({ where: { id: (raw as { id: string }).id }, select: { id: true } });
  await deleteProject(actor, raw);
  revalidatePath("/admin/projects");
  revalidatePath("/projects", "page");
  if (proj) void deleteDocument(`projects:${proj.id}`).catch(() => {});
  redirect("/admin/projects");
}
