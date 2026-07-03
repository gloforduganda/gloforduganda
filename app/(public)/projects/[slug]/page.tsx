import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { db } from "@/lib/db";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { getPublishedProjectBySlug } from "@/lib/services/projects";
import { JsonLd } from "@/components/seo/JsonLd";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";

export async function generateStaticParams() {
  try {
    const items = await db.project.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true },
    });
    return items.map((item) => ({ slug: item.slug }));
  } catch {
    return [];
  }
}

export const revalidate = 3600;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  try {
    const p = await getPublishedProjectBySlug(slug);
    const ogImages = p.cover?.url
      ? [{ url: p.cover.url, width: 1200, height: 630, alt: p.title }]
      : [{ url: "/logo.png", width: 512, height: 512, alt: "Gloford" }];
    return {
      title: p.seoTitle ?? p.title,
      description: p.seoDesc ?? p.summary,
      openGraph: {
        title: p.seoTitle ?? p.title,
        description: p.seoDesc ?? p.summary ?? "",
        type: "article",
        url: `${APP_URL}/projects/${slug}`,
        images: ogImages,
      },
      twitter: { card: "summary_large_image", images: ogImages[0] ? [ogImages[0].url] : [] },
    };
  } catch {
    return {};
  }
}

export default async function ProjectDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let project;
  try {
    project = await getPublishedProjectBySlug(slug);
  } catch {
    notFound();
  }

  return (
    <article>
      <JsonLd
        data={[
          articleJsonLd({
            title: project.title,
            path: `/projects/${slug}`,
            description: project.summary,
            coverUrl: project.cover?.url,
          }),
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Projects", href: "/projects" },
            { name: project.title, href: `/projects/${slug}` },
          ]),
        ]}
      />
      <section className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{project.title}</h1>
        <p className="mt-4 text-lg text-[var(--color-muted-fg)]">{project.summary}</p>
        {project.cover?.url && (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-xl">
            <Image src={project.cover.url} alt={project.cover.alt ?? project.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 896px" priority />
          </div>
        )}
      </section>
      <BlockRenderer blocks={project.body} />
    </article>
  );
}
