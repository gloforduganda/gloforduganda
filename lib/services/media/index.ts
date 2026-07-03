import { createService } from "@/lib/services/_shared";
import {
  mediaFinalizeSchema,
  mediaDeleteSchema,
  mediaToggleGallerySchema,
} from "@/lib/validators/media";
import { deleteObject, publicUrlFor } from "@/lib/storage/r2";
import { db } from "@/lib/db";

export const finalizeMediaUpload = createService({
  module: "media",
  action: "upload",
  schema: mediaFinalizeSchema,
  permission: () => ({ type: "Media" }),
  exec: async ({ input, actor, tx }) => {
    // Verify the uploader exists so the FK insert doesn't fail if the
    // session was issued before a DB reset. Fall back to anonymous if not.
    const uploaderExists = await tx.user.findUnique({
      where: { id: actor.userId },
      select: { id: true },
    });
    const row = await tx.media.create({
      data: {
        url: publicUrlFor(input.key),
        key: input.key,
        mime: input.mime,
        sizeBytes: input.sizeBytes,
        width: input.width,
        height: input.height,
        alt: input.alt,
        uploadedById: uploaderExists ? actor.userId : null,
      },
    });
    // Note: revalidateTag is called by the Route Handler / Action after this
    // service returns, to avoid calling it inside the Prisma transaction.
    return row;
  },
});

export const deleteMedia = createService({
  module: "media",
  action: "delete",
  schema: mediaDeleteSchema,
  permission: () => ({ type: "Media" }),
  loadBefore: async ({ input, tx }) => tx.media.findUnique({ where: { id: input.id } }),
  exec: async ({ input, tx }) => {
    const row = await tx.media.delete({ where: { id: input.id } });
    void deleteObject(row.key).catch(() => {});
    return { id: row.id };
  },
});

export function listMedia(take = 100) {
  return db.media.findMany({
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true, url: true, key: true, mime: true, width: true, height: true,
      sizeBytes: true, alt: true, showInGallery: true, createdAt: true,
    },
  });
}

export function listGalleryImages(take = 20) {
  return db.media.findMany({
    where: { showInGallery: true, mime: { startsWith: "image/" } },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, url: true, alt: true },
  });
}

export const toggleGallery = createService({
  module: "media",
  action: "update",
  schema: mediaToggleGallerySchema,
  permission: () => ({ type: "Media" }),
  exec: async ({ input, tx }) => {
    const row = await tx.media.update({
      where: { id: input.id },
      data: { showInGallery: input.showInGallery },
    });
    return row;
  },
});
