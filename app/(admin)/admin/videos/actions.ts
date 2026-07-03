"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import { createVideo, updateVideo, deleteVideo } from "@/lib/services/videos";

export async function createVideoAction(formData: FormData) {
  await requireActorFromSession();
  await createVideo({
    title: formData.get("title") as string,
    youtubeUrl: formData.get("youtubeUrl") as string,
    description: (formData.get("description") as string) || undefined,
    thumbnailUrl: (formData.get("thumbnailUrl") as string) || undefined,
    category: (formData.get("category") as string) || "general",
    order: Number(formData.get("order") ?? 0),
  });
  revalidatePath("/admin/videos");
  revalidatePath("/videos", "page");
}

export async function updateVideoAction(formData: FormData) {
  await requireActorFromSession();
  const id = formData.get("id") as string;
  await updateVideo(id, {
    title: formData.get("title") as string,
    youtubeUrl: formData.get("youtubeUrl") as string,
    description: (formData.get("description") as string) || null,
    thumbnailUrl: (formData.get("thumbnailUrl") as string) || null,
    category: (formData.get("category") as string) || "general",
    order: Number(formData.get("order") ?? 0),
    isPublished: formData.get("isPublished") === "true",
  });
  revalidatePath("/admin/videos");
  revalidatePath("/videos", "page");
}

export async function deleteVideoAction(formData: FormData) {
  await requireActorFromSession();
  await deleteVideo(formData.get("id") as string);
  revalidatePath("/admin/videos");
  revalidatePath("/videos", "page");
}

export async function toggleVideoAction(formData: FormData) {
  await requireActorFromSession();
  const id = formData.get("id") as string;
  const isPublished = formData.get("isPublished") === "true";
  await updateVideo(id, { isPublished: !isPublished });
  revalidatePath("/admin/videos");
  revalidatePath("/videos", "page");
}
