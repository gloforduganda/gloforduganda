"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActorFromSession } from "@/lib/auth-context";
import { createProgram, updateProgram, setProgramStatus, deleteProgram } from "@/lib/services/programs";
import { upsertDocuments, deleteDocument, programToDoc } from "@/lib/search/sync";
import { db } from "@/lib/db";

export async function createProgramAction(raw: unknown) {
  const actor = await requireActorFromSession();
  const row = await createProgram(actor, raw);
  revalidatePath("/admin/programs");
  revalidatePath("/programs", "page");
  void upsertDocuments([programToDoc(row)]).catch(() => {});
  redirect(`/admin/programs/${row.id}`);
}

export async function updateProgramAction(raw: unknown) {
  const actor = await requireActorFromSession();
  const row = await updateProgram(actor, raw);
  revalidatePath("/admin/programs");
  revalidatePath(`/admin/programs/${row.id}`);
  revalidatePath("/programs", "page");
  revalidatePath(`/programs/${row.slug}`, "page");
  void upsertDocuments([programToDoc(row)]).catch(() => {});
}

export async function setProgramStatusAction(raw: unknown) {
  const actor = await requireActorFromSession();
  const row = await setProgramStatus(actor, raw);
  revalidatePath("/admin/programs");
  revalidatePath(`/admin/programs/${row.id}`);
  revalidatePath("/programs", "page");
  revalidatePath(`/programs/${row.slug}`, "page");
  if (row.status === "PUBLISHED") {
    void upsertDocuments([programToDoc(row)]).catch(() => {});
  } else {
    void deleteDocument(`programs:${row.id}`).catch(() => {});
  }
}

export async function deleteProgramAction(raw: unknown) {
  const actor = await requireActorFromSession();
  const prog = await db.program.findUnique({ where: { id: (raw as { id: string }).id }, select: { id: true } });
  await deleteProgram(actor, raw);
  revalidatePath("/admin/programs");
  revalidatePath("/programs", "page");
  if (prog) void deleteDocument(`programs:${prog.id}`).catch(() => {});
  redirect("/admin/programs");
}
