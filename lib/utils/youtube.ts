/** Pure YouTube URL utilities — no server-only imports, safe for client components. */

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = p.exec(url);
    if (m?.[1]) return m[1];
  }
  return null;
}

export function youtubeThumbnail(youtubeId: string, quality: "hq" | "maxres" = "hq") {
  return quality === "maxres"
    ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
    : `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}
