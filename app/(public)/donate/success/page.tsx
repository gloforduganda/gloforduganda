import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/utils/money";
import { DonateSuccessClient } from "./DonateSuccessClient";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";

export const metadata: Metadata = {
  title: "Thank You — Donation Received",
  description: "Your donation is being processed. Thank you for supporting our community programs.",
  openGraph: {
    title: "Thank You — Donation Received",
    description: "Your donation is being processed. Thank you for supporting our community programs.",
    type: "website",
    url: `${APP_URL}/donate/success`,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Gloford" }],
  },
  twitter: { card: "summary_large_image", images: ["/logo.png"] },
  robots: { index: false, follow: false },
};

export default async function DonateSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; donation_id?: string }>;
}) {
  const sp = await searchParams;
  const ref = sp.session_id ?? sp.donation_id ?? null;

  let donationInfo: { amount: string; campaign?: string; donorName?: string } | null = null;

  if (ref) {
    try {
      const donation = await db.donation.findFirst({
        where: {
          OR: [
            { providerRef: ref },
            { id: ref },
          ],
        },
        select: {
          amountCents: true,
          currency: true,
          donor: { select: { name: true } },
          campaign: { select: { title: true } },
        },
      });
      if (donation) {
        donationInfo = {
          amount: formatMoney(donation.amountCents, donation.currency),
          campaign: donation.campaign?.title ?? undefined,
          donorName: donation.donor?.name ?? undefined,
        };
      }
    } catch {
      // Non-critical — fall back to generic message
    }
  }

  return <DonateSuccessClient donationInfo={donationInfo} />;
}
