import Link from "next/link";
import { Suspense } from "react";
import { requireActorFromSession } from "@/lib/auth-context";
import { DonationFilters } from "./DonationFilters";
import { listDonations } from "@/lib/services/donations";
import { formatMoney } from "@/lib/utils/money";
import { Pagination } from "@/components/admin/Pagination";
import { DonationStatusBadge } from "./StatusBadge";
import { RefundButton } from "./RefundButton";
import type { DonationStatus, PaymentProvider } from "@prisma/client";

export const metadata = { title: "Donations", robots: { index: false, follow: false } };

const STATUSES: DonationStatus[] = ["PENDING", "SUCCEEDED", "FAILED", "REFUNDED"];
const PROVIDERS: PaymentProvider[] = ["STRIPE", "PESAPAL", "MTN_MOMO", "AIRTEL_MONEY"];

export default async function DonationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; provider?: string; from?: string; to?: string; campaign?: string; donor?: string }>;
}) {
  await requireActorFromSession();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const filters = {
    status: (STATUSES.includes(sp.status as DonationStatus) ? sp.status as DonationStatus : undefined),
    provider: (PROVIDERS.includes(sp.provider as PaymentProvider) ? sp.provider as PaymentProvider : undefined),
    from: sp.from ? new Date(sp.from) : undefined,
    to: sp.to ? new Date(sp.to) : undefined,
    campaignTitle: sp.campaign || undefined,
    donorSearch: sp.donor?.trim() || undefined,
  };

  const { rows, total, totalPages } = await listDonations({ page, perPage: 50, ...filters });

  const succeededCents = rows
    .filter((r) => r.status === "SUCCEEDED")
    .reduce<Record<string, number>>((acc, r) => {
      acc[r.currency] = (acc[r.currency] ?? 0) + r.amountCents;
      return acc;
    }, {});

  const raisedLabel =
    Object.entries(succeededCents)
      .map(([currency, cents]) => formatMoney(cents, currency))
      .join(" + ") || formatMoney(0, "USD");

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { status: sp.status, provider: sp.provider, from: sp.from, to: sp.to, campaign: sp.campaign, donor: sp.donor, ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    return `/admin/donations?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Donations</h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          {total} records · {raisedLabel} succeeded on this page
        </p>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Suspense>
          <DonationFilters />
        </Suspense>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/api/exports/donations" className="ml-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm hover:bg-[var(--color-muted)]">
          Export CSV
        </a>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[rgb(var(--token-muted)/0.50)] text-left text-xs uppercase tracking-wider text-[var(--color-muted-fg)]">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Donor</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 w-0">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[var(--color-muted-fg)]">
                    No donations match the current filters.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {r.donor ? (
                        <Link href={`/admin/donors/${r.donor.id}`} className="hover:underline">
                          <p className="font-medium">{r.donor.name ?? r.donor.email}</p>
                          {r.donor.name ? (
                            <p className="text-xs text-[var(--color-muted-fg)]">{r.donor.email}</p>
                          ) : null}
                        </Link>
                      ) : (
                        <span className="text-[var(--color-muted-fg)]">Anonymous</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatMoney(r.amountCents, r.currency)}
                      {r.type === "RECURRING" ? (
                        <span className="ml-1 text-xs text-[var(--color-muted-fg)]">/mo</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {r.campaign ? (
                        <Link href={`/admin/campaigns/${r.campaign.id}`} className="hover:underline">
                          {r.campaign.title}
                        </Link>
                      ) : (
                        <span className="text-[var(--color-muted-fg)]">&mdash;</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">{r.provider.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3">
                      <DonationStatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "SUCCEEDED" ? (
                        <RefundButton
                          id={r.id}
                          amountLabel={formatMoney(r.amountCents, r.currency)}
                          amountCents={r.amountCents}
                        />
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} total={total} basePath={buildUrl({ page: undefined })} />
    </div>
  );
}
