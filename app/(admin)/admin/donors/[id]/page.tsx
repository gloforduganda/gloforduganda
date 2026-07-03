import { notFound } from "next/navigation";
import Link from "next/link";
import { requireActorFromSession } from "@/lib/auth-context";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/utils/money";
import { DonationStatusBadge } from "../../donations/StatusBadge";
import { ArrowLeft, Mail, Phone, Globe } from "lucide-react";

export const metadata = { title: "Donor", robots: { index: false, follow: false } };

export default async function DonorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireActorFromSession();
  const { id } = await params;

  const donor = await db.donor.findUnique({
    where: { id },
    include: {
      donations: {
        orderBy: { createdAt: "desc" },
        include: { campaign: { select: { id: true, title: true } } },
      },
    },
  });

  if (!donor) notFound();

  const succeeded = donor.donations.filter((d) => d.status === "SUCCEEDED");
  const totalByCurrency = succeeded.reduce<Record<string, number>>((acc, d) => {
    acc[d.currency] = (acc[d.currency] ?? 0) + d.amountCents;
    return acc;
  }, {});
  const totalLabel = Object.entries(totalByCurrency)
    .map(([c, cents]) => formatMoney(cents, c))
    .join(" + ") || formatMoney(0, "USD");

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <Link href="/admin/donors" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]">
          <ArrowLeft className="h-4 w-4" /> Donors
        </Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Donor card */}
        <aside className="space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--token-primary)/0.10)] text-xl font-bold text-[var(--color-primary)]">
              {(donor.name ?? donor.email)[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-semibold">{donor.name ?? "Anonymous"}</h1>
              <p className="text-sm text-[var(--color-muted-fg)]">Donor since {new Date(donor.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-[var(--color-muted-fg)]">
                <Mail className="h-4 w-4 shrink-0" /> {donor.email}
              </p>
              {donor.phone && (
                <p className="flex items-center gap-2 text-[var(--color-muted-fg)]">
                  <Phone className="h-4 w-4 shrink-0" /> {donor.phone}
                </p>
              )}
              {donor.country && (
                <p className="flex items-center gap-2 text-[var(--color-muted-fg)]">
                  <Globe className="h-4 w-4 shrink-0" /> {donor.country}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-muted-fg)]">Total donated</span>
              <span className="font-semibold text-[var(--color-primary)]">{totalLabel}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-muted-fg)]">Successful donations</span>
              <span className="font-semibold">{succeeded.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-muted-fg)]">Total attempts</span>
              <span className="font-semibold">{donor.donations.length}</span>
            </div>
            {succeeded.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-muted-fg)]">Last donation</span>
                <span className="font-semibold">{new Date(succeeded[0]!.createdAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </aside>

        {/* Donation history */}
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]">
          <div className="border-b border-[var(--color-border)] px-5 py-3">
            <h2 className="text-sm font-semibold">Donation History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--color-border)] bg-[rgb(var(--token-muted)/0.50)] text-left text-xs uppercase tracking-wider text-[var(--color-muted-fg)]">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {donor.donations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-[var(--color-muted-fg)]">No donations yet.</td>
                  </tr>
                ) : (
                  donor.donations.map((d) => (
                    <tr key={d.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="px-4 py-3 text-[var(--color-muted-fg)]">{new Date(d.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-medium">
                        {formatMoney(d.amountCents, d.currency)}
                        {d.type === "RECURRING" && <span className="ml-1 text-xs text-[var(--color-muted-fg)]">/mo</span>}
                      </td>
                      <td className="px-4 py-3">
                        {d.campaign ? (
                          <Link href={`/admin/campaigns/${d.campaign.id}`} className="hover:underline">{d.campaign.title}</Link>
                        ) : <span className="text-[var(--color-muted-fg)]">&mdash;</span>}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-muted-fg)]">{d.provider.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3"><DonationStatusBadge status={d.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
