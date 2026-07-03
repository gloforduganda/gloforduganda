import { db } from "@/lib/db";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { extractYouTubeId, youtubeThumbnail } from "@/lib/utils/youtube";

export { extractYouTubeId, youtubeThumbnail };

const CACHE_TAG = "videos";

export const getPublishedVideos = unstable_cache(
  async (category?: string) => {
    return db.videoPost.findMany({
      where: { isPublished: true, ...(category ? { category } : {}) },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: { _count: { select: { views: true } } },
    });
  },
  ["videos-published"],
  { tags: [CACHE_TAG], revalidate: 300 },
);

export async function getAllVideos() {
  return db.videoPost.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { views: true } } },
  });
}

export async function getVideoById(id: string) {
  return db.videoPost.findUniqueOrThrow({
    where: { id },
    include: { _count: { select: { views: true } } },
  });
}

export async function createVideo(data: {
  title: string;
  youtubeUrl: string;
  description?: string;
  thumbnailUrl?: string;
  category?: string;
  order?: number;
}) {
  const youtubeId = extractYouTubeId(data.youtubeUrl);
  if (!youtubeId) throw new Error("Invalid YouTube URL");
  const video = await db.videoPost.create({
    data: {
      ...data,
      youtubeId,
      thumbnailUrl: data.thumbnailUrl || youtubeThumbnail(youtubeId, "maxres"),
    },
  });
  revalidateTag(CACHE_TAG);
  revalidatePath("/videos", "page");
  return video;
}

export async function updateVideo(
  id: string,
  data: {
    title?: string;
    youtubeUrl?: string;
    description?: string | null;
    thumbnailUrl?: string | null;
    category?: string;
    order?: number;
    isPublished?: boolean;
  },
) {
  let youtubeId: string | undefined;
  if (data.youtubeUrl) {
    const extracted = extractYouTubeId(data.youtubeUrl);
    if (!extracted) throw new Error("Invalid YouTube URL");
    youtubeId = extracted;
  }
  const video = await db.videoPost.update({
    where: { id },
    data: {
      ...data,
      ...(youtubeId ? { youtubeId } : {}),
    },
  });
  revalidateTag(CACHE_TAG);
  revalidatePath("/videos", "page");
  return video;
}

export async function deleteVideo(id: string) {
  await db.videoPost.delete({ where: { id } });
  revalidateTag(CACHE_TAG);
  revalidatePath("/videos", "page");
}

// ── Analytics ──────────────────────────────────────────────

export async function recordVideoView(data: {
  videoId: string;
  sessionId?: string;
  watchedMs?: number;
  percentWatched?: number;
  completed?: boolean;
  country?: string;
  deviceType?: string;
}) {
  // Upsert by videoId + sessionId to avoid duplicate rows per session
  if (data.sessionId) {
    const existing = await db.videoView.findFirst({
      where: { videoId: data.videoId, sessionId: data.sessionId },
    });
    if (existing) {
      return db.videoView.update({
        where: { id: existing.id },
        data: {
          watchedMs: Math.max(existing.watchedMs, data.watchedMs ?? 0),
          percentWatched: Math.max(existing.percentWatched, data.percentWatched ?? 0),
          completed: existing.completed || (data.completed ?? false),
          updatedAt: new Date(),
        },
      });
    }
  }
  return db.videoView.create({ data });
}

export async function getVideoAnalytics(videoId: string) {
  const [views, watchStats] = await Promise.all([
    db.videoView.count({ where: { videoId } }),
    db.videoView.aggregate({
      where: { videoId },
      _avg: { watchedMs: true, percentWatched: true },
      _sum: { watchedMs: true },
      _count: { completed: true },
    }),
  ]);

  const completions = await db.videoView.count({ where: { videoId, completed: true } });
  const byDevice = await db.videoView.groupBy({
    by: ["deviceType"],
    where: { videoId },
    _count: { deviceType: true },
  });
  const byCountry = await db.videoView.groupBy({
    by: ["country"],
    where: { videoId, country: { not: null } },
    _count: { country: true },
    orderBy: { _count: { country: "desc" } },
    take: 10,
  });

  // Views over last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentViews = await db.videoView.count({
    where: { videoId, createdAt: { gte: thirtyDaysAgo } },
  });

  return {
    totalViews: views,
    recentViews,
    completions,
    completionRate: views > 0 ? Math.round((completions / views) * 100) : 0,
    avgWatchedMs: Math.round(watchStats._avg.watchedMs ?? 0),
    avgWatchedSec: Math.round((watchStats._avg.watchedMs ?? 0) / 1000),
    avgPercentWatched: Math.round(watchStats._avg.percentWatched ?? 0),
    totalWatchedMs: watchStats._sum.watchedMs ?? 0,
    byDevice: byDevice.map((r) => ({ device: r.deviceType ?? "unknown", count: r._count.deviceType })),
    byCountry: byCountry.map((r) => ({ country: r.country ?? "unknown", count: r._count.country })),
  };
}

export async function getAllVideoAnalytics() {
  const videos = await db.videoPost.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { views: true } } },
  });
  return videos;
}
