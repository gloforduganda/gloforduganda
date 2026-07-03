import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import { finalizeMediaUpload } from "@/lib/services/media";
import { buildMediaKey, saveFile } from "@/lib/storage/r2";
import { isAppError, toSafeError } from "@/lib/errors";
import { captureException } from "@/lib/observability/sentry";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_MIME = new Set([
  "image/jpeg", "image/png", "image/webp",
  "image/avif", "image/gif",
  "application/pdf",
]);
const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const actor = await requireActorFromSession();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File exceeds 25 MB limit" }, { status: 400 });
    }

    const key = buildMediaKey(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      await saveFile(key, buffer);
    } catch (fsErr) {
      console.error("[media/presign] saveFile failed — check UPLOAD_DIR permissions:", fsErr);
      throw fsErr;
    }

    const row = await finalizeMediaUpload(actor, {
      key,
      mime: file.type,
      sizeBytes: file.size,
    });

    // Invalidate media cache OUTSIDE the Prisma transaction
    try { revalidateTag("media"); } catch { /* non-critical */ }

    return NextResponse.json(row);
  } catch (e) {
    console.error("[media/presign] upload error:", e);
    captureException(e, { route: "POST /api/media/presign" });
    const safe = toSafeError(e);
    return NextResponse.json(
      { error: safe.message, code: safe.code },
      { status: isAppError(e) ? e.status : 500 },
    );
  }
}
