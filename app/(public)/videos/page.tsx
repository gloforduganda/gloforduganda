import type { Metadata } from "next";
import { getPublishedVideos } from "@/lib/services/videos";
import { VideoGrid } from "./VideoGrid";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Videos",
  description: "Watch videos from our programs, events, and community stories.",
};

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const videos = await getPublishedVideos();

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Videos", href: "/videos" },
          ]),
        ]}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[rgb(248_250_249)] via-white to-[rgb(240_247_244)] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              Media
            </p>
            <h1 className="font-display text-4xl font-bold text-[var(--color-fg)] sm:text-5xl">
              Videos
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-[var(--color-muted-fg)]">
              Stories, program highlights, and community voices from the field.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Grid */}
      <section className="bg-[var(--color-bg)] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {videos.length === 0 ? (
            <div className="py-20 text-center text-[var(--color-muted-fg)]">
              No videos published yet. Check back soon.
            </div>
          ) : (
            <VideoGrid videos={videos} />
          )}
        </div>
      </section>
    </>
  );
}
