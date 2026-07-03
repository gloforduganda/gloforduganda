import { NextRequest, NextResponse } from "next/server";
import { recordVideoView } from "@/lib/services/videos";
import { rateLimit, tooManyRequests, clientIdentifier } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const rl = await rateLimit({
    bucket: "video-view",
    identifier: clientIdentifier(req),
    limit: 120,
    windowSeconds: 60,
  });
  if (!rl.ok) return tooManyRequests(rl);

  try {
    const body = await req.json() as {
      videoId: string;
      sessionId?: string;
      watchedMs?: number;
      percentWatched?: number;
      completed?: boolean;
    };

    if (!body.videoId || typeof body.videoId !== "string") {
      return NextResponse.json({ error: "videoId required" }, { status: 400 });
    }

    const ua = req.headers.get("user-agent") ?? "";
    const deviceType = /mobile|android|iphone/i.test(ua)
      ? "mobile"
      : /tablet|ipad/i.test(ua)
        ? "tablet"
        : "desktop";

    const country =
      req.headers.get("cf-ipcountry") ??
      req.headers.get("x-vercel-ip-country") ??
      null;

    await recordVideoView({
      videoId: body.videoId,
      sessionId: typeof body.sessionId === "string" ? body.sessionId.slice(0, 64) : undefined,
      watchedMs: typeof body.watchedMs === "number" ? Math.max(0, body.watchedMs) : 0,
      percentWatched: typeof body.percentWatched === "number"
        ? Math.min(100, Math.max(0, body.percentWatched))
        : 0,
      completed: body.completed === true,
      country: country?.slice(0, 2) ?? undefined,
      deviceType,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
