import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCareerBySlug } from "@/lib/services/careers";
import { CareerApplyForm } from "./CareerApplyForm";
import { isAppError } from "@/lib/errors";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const career = await getCareerBySlug(slug);
    const title = `Apply: ${career.title}`;
    const description = `Submit your application for ${career.title} in ${career.department}.`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        url: `${APP_URL}/careers/${slug}/apply`,
        images: [{ url: "/logo.png", width: 512, height: 512, alt: "Gloford" }],
      },
      twitter: { card: "summary_large_image", images: ["/logo.png"] },
      robots: { index: false, follow: false },
    };
  } catch {
    return { title: "Apply" };
  }
}

export default async function CareerApplyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let career;
  try {
    career = await getCareerBySlug(slug);
  } catch (e) {
    if (isAppError(e) && e.status === 404) notFound();
    throw e;
  }

  type CustomField = { id: string; label: string; type: string; required: boolean; options?: string[] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = career as any;
  const customFields: CustomField[] = Array.isArray(row.customFields) ? row.customFields : [];

  return (
    <CareerApplyForm
      slug={slug}
      jobTitle={career.title}
      department={career.department}
      location={career.location}
      type={career.type}
      requirements={career.requirements as string[]}
      customFields={customFields}
    />
  );
}
