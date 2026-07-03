import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { getPublishedPostBySlug } from "@/lib/services/posts";
import { sanitizeHtml } from "@/lib/blocks/sanitize";
import { JsonLd } from "@/components/seo/JsonLd";
import { blogPostingJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { isAppError } from "@/lib/errors";

function extractHtml(body: unknown): string {
  if (!Array.isArray(body)) return "";
  const rt = body.find((b: { type?: string }) => b.type === "richText");
  return rt ? (rt as { data: { html: string } }).data.html ?? "" : "";
}

export async function generateStaticParams() {
  try {
    const items = await db.post.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true },
    });
    return items.map((item) => ({ slug: item.slug }));
  } catch {
    return [];
  }
}

export const revalidate = 3600; // ISR: revalidate every hour

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  try {
    const p = await getPublishedPostBySlug(slug);
    return {
      title: p.seoTitle ?? p.title,
      description: p.seoDesc ?? p.excerpt ?? undefined,
      openGraph: {
        title: p.seoTitle ?? p.title,
        description: p.seoDesc ?? p.excerpt ?? "",
        type: "article",
        url: `${APP_URL}/blog/${slug}`,
        images: p.cover?.url
          ? [{ url: p.cover.url, width: 1200, height: 630, alt: p.title }]
          : [{ url: "/logo.png", width: 512, height: 512, alt: "Gloford" }],
      },
      twitter: {
        card: "summary_large_image",
        images: p.cover?.url ? [p.cover.url] : ["/logo.png"],
      },
    };
  } catch {
    return {};
  }
}

export default async function PostDetail({ params }: { params: Promise<{ slug: string }> }) {
  const t = await getTranslations("public.blogDetail");
  const { slug } = await params;

  let post;
  try {
    post = await getPublishedPostBySlug(slug);
  } catch (e) {
    if (isAppError(e) && e.status === 404) notFound();
    throw e;
  }

  return (
    <article>
      <JsonLd
        data={[
          blogPostingJsonLd({
            title: post.title,
            slug,
            excerpt: post.excerpt,
            publishedAt: post.publishedAt,
            authorName: post.author?.name,
            coverUrl: post.cover?.url,
            tags: post.tags.map((pt) => pt.tag.name),
          }),
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Blog", href: "/blog" },
            { name: post.title, href: `/blog/${slug}` },
          ]),
        ]}
      />
      <header className="mx-auto max-w-3xl px-4 py-10">
        {post.publishedAt ? (
          <time className="text-xs uppercase tracking-wide text-[var(--color-muted-fg)]">
            {new Date(post.publishedAt).toLocaleDateString()}
          </time>
        ) : null}
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{post.title}</h1>
        {post.author?.name ? (
          <p className="mt-3 text-sm text-[var(--color-muted-fg)]">{t("by", { name: post.author.name })}</p>
        ) : null}
        {post.tags.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((pt) => (
              <li key={pt.tag.id} className="rounded-full bg-[var(--color-muted)] px-3 py-1 text-xs">
                {pt.tag.name}
              </li>
            ))}
          </ul>
        ) : null}
        {post.cover?.url ? (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-xl">
            <Image
              src={post.cover.url}
              alt={post.cover.alt ?? post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        ) : null}
      </header>
      <div className="mx-auto max-w-3xl px-4 pb-16">
        <div
          className="prose prose-gray max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:text-[1.04rem] prose-p:leading-8 prose-a:text-[var(--color-primary)] prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(extractHtml(post.body)) }}
        />
      </div>
    </article>
  );
}
