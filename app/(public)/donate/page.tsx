import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { listActiveCampaigns } from "@/lib/services/campaigns";
import { DonateWidget, type WidgetProvider } from "@/components/donate/DonateWidget";
import { getPublicDonationContext } from "@/lib/services/donations/public";
import { formatMoney } from "@/lib/utils/money";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Heart, Target, ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { getTranslations } from "next-intl/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";

export const metadata: Metadata = {
  title: "Donate",
  description: "Support community-led programs in health, education, and resilience.",
  openGraph: {
    title: "Donate",
    description: "Support community-led programs in health, education, and resilience.",
    type: "website",
    url: `${APP_URL}/donate`,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Gloford" }],
  },
  twitter: { card: "summary_large_image", title: "Donate", images: ["/logo.png"] },
};

export default async function DonatePage() {
  const t = await getTranslations("public.donate");

  let ctx;
  try {
    ctx = await getPublicDonationContext();
  } catch {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <Heart className="mx-auto mb-4 h-12 w-12 text-[var(--color-muted-fg)]" />
          <p className="mt-3 text-[var(--color-muted-fg)]">{t("errorUnavailable")}</p>
          <Link href="/contact" className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white">
            Contact Us
          </Link>
        </div>
      </section>
    );
  }

  const { org, providers, donationsEnabled, campaignsEnabled } = ctx;

  if (!donationsEnabled) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <Heart className="mx-auto mb-4 h-12 w-12 text-[var(--color-muted-fg)]" />
          <h1 className="text-3xl font-bold text-[var(--color-fg)]">{t("notAvailableTitle")}</h1>
          <p className="mt-3 text-[var(--color-muted-fg)]">{t("notAvailableDesc")}</p>
          <Link href="/"
            className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white">
            Back to Home
          </Link>
        </div>
      </section>
    );
  }

  const campaigns = campaignsEnabled ? await listActiveCampaigns() : [];

  // Get donation totals per campaign for progress bars
  const campaignProgress = await Promise.all(
    campaigns.map(async (c) => {
      const result = await db.donation.aggregate({
        where: { campaignId: c.id, status: "SUCCEEDED" },
        _sum: { amountCents: true },
        _count: true,
      });
      return {
        ...c,
        raisedCents: result._sum.amountCents ?? 0,
        donorCount: result._count,
      };
    }),
  );

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Donate", href: "/donate" },
        ])}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[rgb(248_250_249)] via-white to-[rgb(240_247_244)] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <ScrollReveal>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              {t("pageEyebrow")}
            </p>
            <h1 className="font-display text-4xl font-bold text-[var(--color-fg)] sm:text-5xl">
              {t("pageHeading", { name: org.name })}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[var(--color-muted-fg)]">
              {t("pageSubheading")}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Main content */}
      <section className="bg-[var(--color-bg)] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_420px]">
            {/* Left: campaigns + general */}
            <div className="space-y-10">
              {/* Active campaigns */}
              {campaignsEnabled && campaignProgress.length > 0 && (
                <div>
                  <ScrollReveal>
                    <h2 className="font-display text-2xl font-bold text-[var(--color-fg)]">{t("activeCampaignsTitle")}</h2>
                    <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
                      {t("activeCampaignsDesc")}
                    </p>
                  </ScrollReveal>
                  <div className="mt-6 space-y-4">
                    {campaignProgress.map((c, i) => {
                      const percentage = c.goalCents
                        ? Math.min(100, Math.round((c.raisedCents / c.goalCents) * 100))
                        : null;
                      return (
                        <ScrollReveal key={c.id} delay={i * 0.05}>
                          <Link
                            href={`/donate/${c.slug}`}
                            className="group block rounded-2xl border border-[var(--color-border)] bg-white p-6 transition hover:shadow-xl hover:border-[rgb(var(--token-primary)/0.30)]"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-[var(--color-fg)] group-hover:text-[var(--color-primary)]">
                                  {c.title}
                                </h3>
                                <p className="mt-1 line-clamp-2 text-sm text-[var(--color-muted-fg)]">
                                  {c.description}
                                </p>
                              </div>
                              <div className="flex-shrink-0">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgb(var(--token-primary)/0.10)]">
                                  <Target className="h-5 w-5 text-[var(--color-primary)]" />
                                </div>
                              </div>
                            </div>

                            {/* Progress bar */}
                            {c.goalCents && (
                              <div className="mt-4">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-semibold text-[var(--color-primary)]">
                                    {t("raisedLabel", { amount: formatMoney(c.raisedCents, c.currency) })}
                                  </span>
                                  <span className="text-[var(--color-muted-fg)]">
                                    {t("goalLabel", { amount: formatMoney(c.goalCents, c.currency) })}
                                  </span>
                                </div>
                                <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-[var(--color-muted)]">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <div className="mt-1.5 flex items-center justify-between text-xs text-[var(--color-muted-fg)]">
                                  <span>{t("fundedLabel", { pct: percentage ?? 0 })}</span>
                                  <span>{t("donorCount", { n: c.donorCount })}</span>
                                </div>
                              </div>
                            )}

                            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)]">
                              {t("donateToCampaign")} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                            </span>
                          </Link>
                        </ScrollReveal>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* General donation info */}
              <ScrollReveal>
                <div className="rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[rgb(240_247_244)] to-[rgb(230_242_236)] p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--token-primary)/0.10)]">
                      <Heart className="h-6 w-6 text-[var(--color-primary)]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--color-fg)]">{t("generalDonationTitle")}</h3>
                      <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
                        {t("generalDonationDesc")}
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Right: Donation widget */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <ScrollReveal delay={0.2}>
                <DonateWidget providers={providers as WidgetProvider[]} />
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
