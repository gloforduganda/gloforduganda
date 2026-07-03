import { requireActorFromSession } from "@/lib/auth-context";
import { getAllVideos } from "@/lib/services/videos";
import { VideosClient } from "./VideosClient";

export const metadata = { title: "Videos", robots: { index: false, follow: false } };

export default async function VideosAdminPage() {
  await requireActorFromSession();
  const videos = await getAllVideos();
  return <VideosClient videos={videos} />;
}
