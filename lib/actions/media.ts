"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import { finalizeMediaUpload, deleteMedia, toggleGallery, listMedia } from "@/lib/services/media";
import { db } from "@/lib/db";
import { buildMediaKey, saveFile } from "@/lib/storage/r2";

export async function finalizeMediaAction(raw: unknown) {
  const actor = await requireActorFromSession();
  const row = await finalizeMediaUpload(actor, raw);
  revalidateTag("media");
  revalidatePath("/admin/media");
  return row;
}

export async function updateMediaAltAction(mediaId: string, alt: string) {
  await requireActorFromSession();
  await db.media.update({
    where: { id: mediaId },
    data: { alt },
  });
}

export async function deleteMediaAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await deleteMedia(actor, raw);
  revalidateTag("media");
  revalidatePath("/admin/media");
}

export async function toggleGalleryAction(id: string, showInGallery: boolean) {
  const actor = await requireActorFromSession();
  await toggleGallery(actor, { id, showInGallery });
  revalidateTag("media");
  revalidatePath("/admin/media");
}

/**
 * Imports an image from an external URL: fetches it server-side,
 * saves it to storage, creates a Media record, and returns { id, url }.
 */
export async function importMediaFromUrlAction(externalUrl: string): Promise<{ id: string; url: string }> {
  const actor = await requireActorFromSession();

  let res: Response;
  try {
    res = await fetch(externalUrl, { signal: AbortSignal.timeout(15_000) });
  } catch {
    throw new Error("Could not fetch the image URL. Check that it is publicly accessible.");
  }
  if (!res.ok) throw new Error(`Remote server returned ${res.status}`);

  const contentType = res.headers.get("content-type") ?? "";
  const mime = (contentType.split(";")[0] ?? "").trim();
  const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/svg+xml"]);
  if (!allowed.has(mime)) throw new Error(`Unsupported image type: ${mime || "unknown"}`);

  const arrayBuffer = await res.arrayBuffer();
  if (arrayBuffer.byteLength > 25 * 1024 * 1024) throw new Error("Image exceeds 25 MB limit");

  const ext = mime.split("/")[1] ?? "jpg";
  const key = buildMediaKey(`imported.${ext}`);
  await saveFile(key, Buffer.from(arrayBuffer));

  const row = await finalizeMediaUpload(actor, {
    key,
    mime,
    sizeBytes: arrayBuffer.byteLength,
  });
  revalidateTag("media");
  revalidatePath("/admin/media");
  return { id: row.id, url: row.url };
}

/**
 * Returns a paginated Media slice for the ImagePicker component.
 * Image-only, newest first. Auth-gated so you can't scrape the
 * library from the public site.
 */
export async function listMediaForPickerAction(opts?: { take?: number }) {
  await requireActorFromSession();
  const rows = await listMedia(opts?.take ?? 120);
  return rows
    .filter((r) => r.mime.startsWith("image/"))
    .map((r) => ({
      id: r.id,
      url: r.url,
      alt: r.alt ?? "",
      mime: r.mime,
      width: r.width,
      height: r.height,
    }));
}
