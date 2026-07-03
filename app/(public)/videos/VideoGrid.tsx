"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Play, X, Clock, Eye } from "lucide-react";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { youtubeThumbnail } from "@/lib/utils/youtube";

type Video = {
  id: string;
  title: string;
  youtubeId: string;
  youtubeUrl: string;
  description: string | null;
  thumbnailUrl: string | null;
  category: string;
  _count: { views: number };
};

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem("gloford_vsid");
  if (!sid) {
    sid = `vs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem("gloford_vsid", sid);
  }
  return sid;
}

function VideoPlayer({
  video,
  onClose,
}: {
  video: Video;
  onClose: () => void;
}) {
  const startTimeRef = useRef<number>(Date.now());
  const reportedRef = useRef(false);

  const reportView = useCallback(
    async (percentWatched: number, completed: boolean) => {
      if (reportedRef.current && !completed) return;
      const watchedMs = Date.now() - startTimeRef.current;
      try {
        await fetch("/api/videos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoId: video.id,
            sessionId: getSessionId(),
            watchedMs,
            percentWatched,
            completed,
          }),
        });
        if (completed) reportedRef.current = true;
      } catch {
        // fire-and-forget
      }
    },
    [video.id],
  );

  // Report on close — capture ref value at effect setup time
  useEffect(() => {
    const startTime = startTimeRef.current;
    return () => {
      const watchedMs = Date.now() - startTime;
      if (watchedMs > 30000) {
        void reportView(Math.min(100, Math.round((watchedMs / 300000) * 100)), false);
      }
    };
  }, [reportView]);

  // Listen for YouTube iframe API messages
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data?.event === "onStateChange") {
          // 0 = ended
          if (data.info === 0) void reportView(100, true);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [reportView]);

  const embedUrl = `https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Playing: ${video.title}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
    >
      <button
        type="button"
        aria-label="Close video"
        className="absolute inset-0 w-full h-full cursor-default"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-4xl"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Close video"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Player */}
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl">
          <iframe
            src={embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>

        {/* Info */}
        <div className="mt-4 px-1">
          <h2 className="text-lg font-bold text-white">{video.title}</h2>
          {video.description && (
            <p className="mt-1 text-sm text-white/60 line-clamp-2">{video.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function VideoGrid({ videos }: { videos: Video[] }) {
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveVideo(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video, i) => {
          const thumb =
            video.thumbnailUrl ||
            youtubeThumbnail(video.youtubeId, "hq");

          return (
            <ScrollReveal key={video.id} delay={i * 0.05}>
              <button
                onClick={() => setActiveVideo(video)}
                className="group w-full text-left"
                aria-label={`Play ${video.title}`}
              >
                <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden bg-black">
                    <Image
                      src={thumb}
                      alt={video.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = youtubeThumbnail(video.youtubeId, "hq");
                      }}
                    />
                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] shadow-lg">
                        <Play className="h-6 w-6 fill-white text-white" />
                      </div>
                    </div>
                    {/* Always-visible play button */}
                    <div className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
                      <Play className="h-4 w-4 fill-white text-white" />
                    </div>
                    {/* Category badge */}
                    {video.category !== "general" && (
                      <div className="absolute left-3 top-3">
                        <span className="rounded-full bg-[var(--color-primary)] px-2.5 py-0.5 text-[11px] font-semibold capitalize text-white">
                          {video.category}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-[var(--color-fg)] line-clamp-2 group-hover:text-[var(--color-primary)]">
                      {video.title}
                    </h3>
                    {video.description && (
                      <p className="mt-1.5 text-sm text-[var(--color-muted-fg)] line-clamp-2">
                        {video.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-3 text-xs text-[var(--color-muted-fg)]">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {video._count.views} site view{video._count.views !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        YouTube
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </ScrollReveal>
          );
        })}
      </div>

      {activeVideo && (
        <VideoPlayer video={activeVideo} onClose={() => setActiveVideo(null)} />
      )}
    </>
  );
}
