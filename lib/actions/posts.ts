"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActorFromSession } from "@/lib/auth-context";
import { createPost, updatePost, setPostStatus, deletePost } from "@/lib/services/posts";
import { upsertDocuments, deleteDocument, postToDoc } from "@/lib/search/sync";
import { db } from "@/lib/db";

export async function createPostAction(raw: unknown) {
  const actor = await requireActorFromSession();
  const row = await createPost(actor, raw);
  revalidatePath("/admin/posts");
  revalidatePath("/blog", "page");
  void upsertDocuments([postToDoc(row)]).catch(() => {});
  redirect(`/admin/posts/${row.id}`);
}

export async function updatePostAction(raw: unknown) {
  const actor = await requireActorFromSession();
  const row = await updatePost(actor, raw);
  revalidatePath("/admin/posts");
  revalidatePath(`/admin/posts/${row.id}`);
  revalidatePath("/blog", "page");
  revalidatePath(`/blog/${row.slug}`, "page");
  void upsertDocuments([postToDoc(row)]).catch(() => {});
}

export async function setPostStatusAction(raw: unknown) {
  const actor = await requireActorFromSession();
  const row = await setPostStatus(actor, raw);
  revalidatePath("/admin/posts");
  revalidatePath(`/admin/posts/${row.id}`);
  revalidatePath("/blog", "page");
  revalidatePath(`/blog/${row.slug}`, "page");
  if (row.status === "PUBLISHED") {
    void upsertDocuments([postToDoc(row)]).catch(() => {});
  } else {
    void deleteDocument(`posts:${row.id}`).catch(() => {});
  }
}

export async function deletePostAction(raw: unknown) {
  const actor = await requireActorFromSession();
  const post = await db.post.findUnique({ where: { id: (raw as { id: string }).id }, select: { id: true } });
  await deletePost(actor, raw);
  revalidatePath("/admin/posts");
  revalidatePath("/blog", "page");
  if (post) void deleteDocument(`posts:${post.id}`).catch(() => {});
  redirect("/admin/posts");
}
