import { requireActorFromSession } from "@/lib/auth-context";
import { authorize } from "@/lib/rbac/authorize";
import { runAsTenant } from "@/lib/tenant/context";
import { toCsv, csvResponse } from "@/lib/services/exports/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await requireActorFromSession();
  await authorize(actor, "donations.export", { type: "Donation" });

  const donations = await runAsTenant((tx) =>
    tx.donation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        donor: { select: { email: true, name: true, phone: true, country: true } },
        campaign: { select: { title: true, slug: true } },
      },
    }),
  );

  const flat = donations.map((d) => ({
    id: d.id,
    date: d.createdAt,
    completedAt: d.completedAt,
    donorEmail: d.donor?.email ?? "",
    donorName: d.donor?.name ?? "",
    donorPhone: d.donor?.phone ?? "",
    donorCountry: d.donor?.country ?? "",
    amountCents: d.amountCents,
    amount: (d.amountCents / 100).toFixed(2),
    currency: d.currency,
    provider: d.provider,
    status: d.status,
    type: d.type,
    campaign: d.campaign?.title ?? "",
    campaignSlug: d.campaign?.slug ?? "",
    providerRef: d.providerRef,
    receiptUrl: d.receiptUrl ?? "",
    refundedAt: d.refundedAt,
    refundReason: d.refundReason ?? "",
  }));

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(toCsv(flat), `donations-${stamp}.csv`);
}

export async function POST() {
  return new Response("method not allowed", { status: 405 });
}
