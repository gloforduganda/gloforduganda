"use client";

import Link from "next/link";
import {
  FileText,
  Briefcase,
  Users,
  HandCoins,
  Mail,
  CalendarDays,
  ArrowUpRight,
  AlertTriangle,
  PenTool,
  Heart,
  Shield,
  CreditCard,
  UserPlus,
  TrendingUp,
  Zap,
  Eye,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { AnalyticsCharts } from "@/components/admin/AnalyticsCharts";
import { LiveActivityFeed } from "@/components/admin/LiveActivityFeed";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardClient({
  stats,
  userName,
}: {
  stats: {
    pagesPublished: number;
    pagesDraft: number;
    programsPublished: number;
    postsPublished: number;
    subscribersActive: number;
    subscribersPending: number;
    donationsAgg: { _sum: { amountCents: number | null }; _count: number };
    donations30: number;
    donationsTotalAgg: { _sum: { amountCents: number | null } };
    eventsUpcoming: number;
    newslettersDraft: number;
    newslettersSent: number;
    dlqPending: number;
    visitorStats: { today: number; week: number; month: number; total: number };
    topPages: { path: string; views: number }[];
  };
  userName: string;
}) {
  const t = useTranslations("admin.dashboard");
  const shouldReduce = useReducedMotion();
  const fmt = new Intl.NumberFormat("en", { notation: "compact" });
  const currency = new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: shouldReduce ? 0 : 0.045 } },
  };
  const item: Variants = {
    hidden: { opacity: shouldReduce ? 1 : 0, y: shouldReduce ? 0 : 10 },
    show: { opacity: 1, y: 0, transition: { duration: shouldReduce ? 0 : 0.4, ease: [0.25, 0.1, 0.25, 1] } },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Header */}
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <motion.h1
            variants={item}
            className="text-[24px] font-bold tracking-[-0.025em] text-[var(--color-fg)]"
          >
            {getGreeting()}, {userName.split(" ")[0]}
          </motion.h1>
          <motion.p
            variants={item}
            className="mt-0.5 text-[13px] text-[var(--color-muted-fg)]"
          >
            {t("snapshot")}
          </motion.p>
        </div>
        <motion.div variants={item} className="flex gap-2">
          <Link
            href="/admin/pages/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3.5 py-2 text-[13px] font-medium text-white shadow-sm transition-all hover:shadow-md hover:brightness-110"
          >
            <Zap className="h-3.5 w-3.5" />
            Quick create
          </Link>
        </motion.div>
      </header>

      {/* Visitor KPI row */}
      <motion.section variants={container} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard variants={item} icon={Eye} label="Visitors today" value={fmt.format(stats.visitorStats.today)} sub="Unique page views" href="/admin/dashboard" />
        <KpiCard variants={item} icon={Eye} label="Last 7 days" value={fmt.format(stats.visitorStats.week)} sub="Page views" href="/admin/dashboard" />
        <KpiCard variants={item} icon={Eye} label="Last 30 days" value={fmt.format(stats.visitorStats.month)} sub="Page views" href="/admin/dashboard" />
        <KpiCard variants={item} icon={Eye} label="All time" value={fmt.format(stats.visitorStats.total)} sub="Total page views" href="/admin/dashboard" />
      </motion.section>

      {/* KPI Grid — featured row */}
      <motion.section variants={container} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          variants={item}
          icon={HandCoins}
          label={t("kpi.donations30")}
          value={currency.format((stats.donationsAgg._sum.amountCents ?? 0) / 100)}
          sub={t("kpi.donations30Sub", { successful: stats.donationsAgg._count, attempted: stats.donations30 })}
          href="/admin/donations"
          featured
          trend={<TrendingUp className="h-3 w-3" />}
        />
        <KpiCard
          variants={item}
          icon={Users}
          label={t("kpi.subscribers")}
          value={fmt.format(stats.subscribersActive)}
          sub={t("kpi.subscribersSub", { count: stats.subscribersPending })}
          href="/admin/subscribers"
          featured
        />
        <KpiCard
          variants={item}
          icon={CalendarDays}
          label={t("kpi.events")}
          value={fmt.format(stats.eventsUpcoming)}
          sub={t("kpi.eventsSub")}
          href="/admin/events"
          featured
        />
        <KpiCard
          variants={item}
          icon={Heart}
          label={t("kpi.donationsTotal")}
          value={currency.format((stats.donationsTotalAgg._sum.amountCents ?? 0) / 100)}
          sub={t("kpi.donationsTotalSub")}
          href="/admin/donations"
          featured
        />
      </motion.section>

      {/* KPI Grid — secondary row */}
      <motion.section variants={container} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          variants={item}
          icon={FileText}
          label={t("kpi.pages")}
          value={fmt.format(stats.pagesPublished)}
          sub={t("kpi.pagesSub", { count: stats.pagesDraft })}
          href="/admin/pages"
        />
        <KpiCard
          variants={item}
          icon={Briefcase}
          label={t("kpi.programs")}
          value={fmt.format(stats.programsPublished)}
          sub={t("kpi.programsSub")}
          href="/admin/programs"
        />
        <KpiCard
          variants={item}
          icon={PenTool}
          label={t("kpi.posts")}
          value={fmt.format(stats.postsPublished)}
          sub={t("kpi.postsSub")}
          href="/admin/posts"
        />
        <KpiCard
          variants={item}
          icon={Mail}
          label={t("kpi.newsletters")}
          value={fmt.format(stats.newslettersSent)}
          sub={t("kpi.newslettersSub", { count: stats.newslettersDraft })}
          href="/admin/newsletters"
        />
      </motion.section>

      {/* Analytics Charts */}
      <motion.section variants={item}>
        <AnalyticsCharts topPages={stats.topPages} />
      </motion.section>

      {/* Lower grid */}
      <section className="grid gap-4 lg:grid-cols-3">
        {/* Live Activity Feed */}
        <motion.div variants={item} className="lg:col-span-2">
          <LiveActivityFeed />
        </motion.div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Dead-letter queue */}
          <motion.div
            variants={item}
            className={`overflow-hidden rounded-xl border bg-[var(--color-card)] ${
              stats.dlqPending > 0
                ? "border-[rgb(var(--token-danger)/0.30)]"
                : "border-[var(--color-border)]"
            }`}
          >
            <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-5 py-3">
              <AlertTriangle
                className={`h-4 w-4 ${stats.dlqPending > 0 ? "text-[var(--color-danger)]" : "text-[var(--color-muted-fg)]"}`}
              />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">
                {t("deadLetter.title")}
              </p>
            </div>
            <div className="p-5">
              <p className="text-3xl font-bold tracking-tight text-[var(--color-fg)]">
                {fmt.format(stats.dlqPending)}
              </p>
              <p className="mt-1 text-[12px] text-[var(--color-muted-fg)]">
                {stats.dlqPending === 0
                  ? t("deadLetter.zero")
                  : t("deadLetter.pending")}
              </p>
              {stats.dlqPending > 0 && (
                <Link
                  href="/admin/system/dead-letter"
                  className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-[var(--color-danger)] transition hover:underline"
                >
                  {t("deadLetter.action")}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              )}
            </div>
          </motion.div>

          {/* Quick links */}
          <motion.div
            variants={item}
            className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]"
          >
            <div className="border-b border-[var(--color-border)] px-5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">
                {t("quickLinks.title")}
              </p>
            </div>
            <ul className="p-2">
              <QuickLink href="/admin/system/health" icon={Shield} label={t("quickLinks.health")} />
              <QuickLink href="/admin/settings/payments" icon={CreditCard} label={t("quickLinks.payments")} />
              <QuickLink href="/admin/users" icon={UserPlus} label={t("quickLinks.users")} />
            </ul>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}

/* ─── KPI Card ─── */
function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
  variants,
  featured,
  trend,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  href: string;
  variants?: Variants;
  featured?: boolean;
  trend?: React.ReactNode;
}) {
  return (
    <motion.div variants={variants}>
      <Link
        href={href}
        className={`group relative block overflow-hidden rounded-xl border bg-[var(--color-card)] transition-all duration-200 hover:shadow-lg hover:shadow-[rgb(var(--token-primary)/0.06)] ${
          featured
            ? "border-[rgb(var(--token-primary)/0.15)] p-5"
            : "border-[var(--color-border)] p-4"
        }`}
      >
        {/* Top accent for featured cards */}
        {featured && (
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-accent)] to-transparent" />
        )}
        <div className="flex items-center justify-between">
          <div className={`flex items-center justify-center rounded-lg ${
            featured
              ? "h-9 w-9 bg-[rgb(var(--token-primary)/0.10)]"
              : "h-7 w-7 bg-[rgb(var(--token-primary)/0.07)]"
          }`}>
            <Icon
              className={`text-[var(--color-primary)] ${featured ? "h-4.5 w-4.5" : "h-3.5 w-3.5"}`}
              aria-hidden="true"
              strokeWidth={2}
            />
          </div>
          {trend && (
            <span className="flex h-5 items-center gap-0.5 rounded-full bg-[rgb(var(--token-success)/0.10)] px-1.5 text-[10px] font-medium text-[var(--color-success)]">
              {trend}
            </span>
          )}
          <ArrowUpRight className="h-3.5 w-3.5 text-[var(--color-muted-fg)] opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <p className={`mt-3 font-bold tracking-tight text-[var(--color-fg)] ${
          featured ? "text-[28px]" : "text-xl"
        }`}>
          {value}
        </p>
        <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--color-muted-fg)]">
          {label}
        </p>
        <p className="mt-1 text-[11px] text-[var(--color-muted-fg)]">
          {sub}
        </p>
      </Link>
    </motion.div>
  );
}

/* ─── Quick Link ─── */
function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] text-[var(--color-fg)] transition-colors hover:bg-[var(--color-muted)]"
      >
        <Icon
          className="h-[15px] w-[15px] text-[var(--color-muted-fg)]"
          strokeWidth={1.75}
        />
        {label}
        <ArrowUpRight className="ml-auto h-3 w-3 text-[var(--color-muted-fg)] opacity-0 transition-opacity group-hover:opacity-50" />
      </Link>
    </li>
  );
}
