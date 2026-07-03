import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVolunteerBySlug } from "@/lib/services/volunteer";
import { VolunteerApplyForm } from "./VolunteerApplyForm";
import { isAppError } from "@/lib/errors";

type Props = { params: Promise<{ slug: string }> };

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const opp = await getVolunteerBySlug(slug);
    const title = `Apply - ${opp.title}`;
    const description = `Apply to volunteer as ${opp.title} with us.`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        url: `${APP_URL}/volunteer/${slug}/apply`,
        images: [{ url: "/logo.png", width: 512, height: 512, alt: "Gloford" }],
      },
      twitter: { card: "summary_large_image", images: ["/logo.png"] },
      robots: { index: false, follow: false },
    };
  } catch {
    return { title: "Apply" };
  }
}

export default async function VolunteerApplyPage({ params }: Props) {
  const { slug } = await params;
  let opp;
  try {
    opp = await getVolunteerBySlug(slug);
  } catch (e) {
    if (isAppError(e) && e.status === 404) notFound();
    throw e;
  }

  return (
    <section className="w-full bg-gradient-to-br from-[rgb(248_250_249)] to-[rgb(240_247_244)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <VolunteerApplyForm
          opportunityId={opp.id}
          opportunityTitle={opp.title}
          opportunityDepartment={opp.department}
          opportunityLocation={opp.location}
          opportunityCommitment={opp.commitment}
          slug={opp.slug}
        />
      </div>
    </section>
  );
}
