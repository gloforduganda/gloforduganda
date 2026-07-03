import { NextRequest, NextResponse } from "next/server";
import { searchContent } from "@/lib/search/sync";
import { rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = await rateLimit({ bucket: "search", identifier: ip, limit: 30, windowSeconds: 60 });
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ hits: [] });

  const hits = await searchContent(q, { limit: 20 });
  return NextResponse.json({ hits });
}
