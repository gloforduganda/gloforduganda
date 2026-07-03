import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { tags } from "@/lib/cache";

export async function recordVisit(data: {
  path: string;
  referrer?: string | null;
  userAgent?: string | null;
  ip?: string | null;
  country?: string | null;
  city?: string | null;
  sessionId?: string | null;
  userId?: string | null;
}) {
  const ua = data.userAgent ?? "";
  const deviceType = /mobile|android|iphone/i.test(ua)
    ? "mobile"
    : /tablet|ipad/i.test(ua)
      ? "tablet"
      : "desktop";
  const browser = extractBrowser(ua);
  const os = extractOS(ua);

  try {
    await db.siteVisit.create({
      data: {
        path: data.path,
        referrer: data.referrer ?? null,
        userAgent: data.userAgent ?? null,
        ip: data.ip ?? null,
        country: data.country ?? null,
        city: data.city ?? null,
        deviceType,
        browser,
        os,
        sessionId: data.sessionId ?? null,
        userId: data.userId ?? null,
      },
    });
  } catch {
    // Fire-and-forget — don't break the request on tracking failure
  }
}

export function getVisitorStats() {
  return unstable_cache(
    async () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(todayStart);
      monthStart.setDate(monthStart.getDate() - 30);

      const [today, week, month, total] = await Promise.all([
        db.siteVisit.count({ where: { createdAt: { gte: todayStart } } }),
        db.siteVisit.count({ where: { createdAt: { gte: weekStart } } }),
        db.siteVisit.count({ where: { createdAt: { gte: monthStart } } }),
        db.siteVisit.count(),
      ]);

      return { today, week, month, total };
    },
    ["visitor-stats"],
    { tags: [tags.siteVisits()], revalidate: 300 },
  )();
}

export function getTopPages(limit = 10) {
  return unstable_cache(
    async () => {
      const rows = await db.siteVisit.groupBy({
        by: ["path"],
        _count: { path: true },
        orderBy: { _count: { path: "desc" } },
        take: limit,
      });
      return rows.map((r) => ({ path: r.path, views: r._count.path }));
    },
    ["top-pages"],
    { tags: [tags.siteVisits()], revalidate: 300 },
  )();
}

function extractBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/chrome|chromium|crios/i.test(ua)) return "Chrome";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return "Safari";
  if (/opera|opr/i.test(ua)) return "Opera";
  return "Other";
}

function extractOS(ua: string): string {
  if (/windows/i.test(ua)) return "Windows";
  if (/macintosh|mac os/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad/i.test(ua)) return "iOS";
  return "Other";
}
