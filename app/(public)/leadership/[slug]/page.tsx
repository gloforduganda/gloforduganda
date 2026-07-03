import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { getPublishedCollectionPage } from "@/lib/services/pages";
import { isAppError } from "@/lib/errors";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { getBrand } from "@/config/brand";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const page = await getPublishedCollectionPage("team", slug);
    const title = page.seoTitle ?? page.title;
    const description = page.seoDesc ?? undefined;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        url: `${APP_URL}/leadership/${slug}`,
        images: [{ url: "/logo.png", width: 512, height: 512, alt: "Gloford" }],
      },
      twitter: { card: "summary_large_image", images: ["/logo.png"] },
    };
  } catch {
    return {};
  }
}

export default async function LeadershipProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const b = getBrand();
  try {
    const page = await getPublishedCollectionPage("team", slug);
    return (
      <>
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "Person",
              name: page.title,
              description: page.seoDesc ?? undefined,
              url: `${b.siteUrl}/leadership/${slug}`,
              worksFor: {
                "@type": "Organization",
                name: b.name,
                url: b.siteUrl,
              },
            },
            breadcrumbJsonLd([
              { name: "Home", href: "/" },
              { name: "Leadership", href: "/leadership" },
              { name: page.title, href: `/leadership/${slug}` },
            ]),
          ]}
        />
        <BlockRenderer blocks={page.blocks} />
      </>
    );
  } catch (e) {
    if (isAppError(e) && e.status === 404) notFound();
    throw e;
  }
}
