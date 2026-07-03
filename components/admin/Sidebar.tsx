"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  PenTool,
  Image as ImageIcon,
  HandCoins,
  Users,
  Send,
  Tag,
  CalendarDays,
  Settings,
  Shield,
  History,
  Flag,
  Activity,
  AlertTriangle,
  CreditCard,
  X,
  Navigation,
  MessageSquareQuote,
  Quote,
  BarChart3,
  SlidersHorizontal,
  HelpCircle,
  Handshake,
  Newspaper,
  Languages,
  LogOut,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import { signOutAction } from "./actions";

type Group = {
  key: string;
  items: { href: string; key: string; icon: React.ElementType }[];
};

const GROUPS: Group[] = [
  {
    key: "content",
    items: [
      { href: "/admin/dashboard", key: "dashboard", icon: LayoutDashboard },
      { href: "/admin/pages", key: "pages", icon: FileText },
      { href: "/admin/posts", key: "posts", icon: PenTool },
      { href: "/admin/programs", key: "programs", icon: Briefcase },
      { href: "/admin/projects", key: "projects", icon: Briefcase },
      { href: "/admin/impact-stories", key: "impactStories", icon: FileText },
      { href: "/admin/press", key: "press", icon: Newspaper },
      { href: "/admin/reports", key: "reports", icon: FileText },
      { href: "/admin/media", key: "media", icon: ImageIcon },
      { href: "/admin/videos", key: "videos", icon: BarChart3 },
    ],
  },
  {
    key: "people",
    items: [
      { href: "/admin/team", key: "team", icon: Users },
      { href: "/admin/partners", key: "partners", icon: Handshake },
      { href: "/admin/testimonials", key: "testimonials", icon: MessageSquareQuote },
      { href: "/admin/leader-messages", key: "leaderMessages", icon: Quote },
    ],
  },
  {
    key: "engage",
    items: [
      { href: "/admin/careers", key: "careers", icon: Briefcase },
      { href: "/admin/volunteer", key: "volunteer", icon: HandCoins },
      { href: "/admin/partner-applications", key: "partnerApplications", icon: Handshake },
      { href: "/admin/contact-messages", key: "contactMessages", icon: Send },
      { href: "/admin/faqs", key: "faqs", icon: HelpCircle },
      { href: "/admin/events", key: "events", icon: CalendarDays },
    ],
  },
  {
    key: "finance",
    items: [
      { href: "/admin/campaigns", key: "campaigns", icon: HandCoins },
      { href: "/admin/donations", key: "donations", icon: HandCoins },
      { href: "/admin/donors", key: "donors", icon: Users },
    ],
  },
  {
    key: "communications",
    items: [
      { href: "/admin/subscribers", key: "subscribers", icon: Users },
      { href: "/admin/segments", key: "segments", icon: Tag },
      { href: "/admin/newsletters", key: "newsletters", icon: Send },
      { href: "/admin/email-campaigns", key: "emailCampaigns", icon: Send },
    ],
  },
  {
    key: "settings",
    items: [
      { href: "/admin/hero-slides", key: "heroSlides", icon: SlidersHorizontal },
      { href: "/admin/milestones", key: "milestones", icon: History },
      { href: "/admin/site-images", key: "siteImages", icon: ImageIcon },
      { href: "/admin/service-areas", key: "serviceAreas", icon: Briefcase },
      { href: "/admin/translations", key: "translations", icon: Languages },
      { href: "/admin/site-stats", key: "siteStats", icon: BarChart3 },
      { href: "/admin/nav", key: "nav", icon: Navigation },
      { href: "/admin/users", key: "users", icon: Users },
      { href: "/admin/roles", key: "roles", icon: Shield },
      { href: "/admin/settings", key: "settings", icon: Settings },
      { href: "/admin/settings/payments", key: "payments", icon: CreditCard },
      { href: "/admin/settings/search", key: "search", icon: Search },
    ],
  },
  {
    key: "system",
    items: [
      { href: "/admin/system/audit", key: "audit", icon: History },
      { href: "/admin/system/versions", key: "versions", icon: History },
      { href: "/admin/system/dead-letter", key: "deadLetter", icon: AlertTriangle },
      { href: "/admin/system/feature-flags", key: "featureFlags", icon: Flag },
      { href: "/admin/system/health", key: "health", icon: Activity },
    ],
  },
];

export function Sidebar({
  mobileOpen,
  onMobileClose,
  logoUrl,
  siteName,
}: {
  mobileOpen: boolean;
  onMobileClose: () => void;
  logoUrl: string;
  siteName: string;
}) {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[rgb(var(--token-primary))] text-white transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0",
        )}
        aria-label="Admin navigation"
      >
        {/* Brand header */}
        <div className="flex h-[64px] shrink-0 items-center justify-between px-5">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt={siteName} className="h-8 w-8 shrink-0 rounded object-contain" />
            <span className="text-[16px] font-semibold tracking-[-0.01em]">
              {siteName}
            </span>
          </Link>
          {/* Mobile close */}
          <button
            onClick={onMobileClose}
            aria-label="Close menu"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/[0.08] hover:text-white md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation — custom scrollbar */}
        <nav className="sidebar-nav flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3">
          {GROUPS.map((group, gi) => (
            <div key={group.key} className={cn(gi > 0 && "mt-4")}>
              {/* Group label */}
              <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/25">
                {t(group.key)}
              </div>
              <ul className="space-y-0.5">
                {group.items.map(({ href, key, icon: Icon }) => {
                  const active =
                    pathname === href || pathname.startsWith(href + "/");
                  return (
                    <li key={href}>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Link
                            href={href}
                            onClick={onMobileClose}
                            className={cn(
                              "group relative flex items-center gap-3 rounded-lg px-3 py-[8px] text-[13px] transition-all duration-150",
                              active
                                ? "bg-white/[0.12] font-medium text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
                                : "text-white/50 hover:bg-white/[0.06] hover:text-white/80",
                            )}
                          >
                            {/* Active accent bar */}
                            {active && (
                              <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-white/80" />
                            )}
                            <Icon
                              className={cn(
                                "h-[16px] w-[16px] shrink-0 transition-colors",
                                active
                                  ? "text-white"
                                  : "text-white/35 group-hover:text-white/60",
                              )}
                              aria-hidden="true"
                              strokeWidth={1.75}
                            />
                            <span className="truncate">{t(key)}</span>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8} className="md:hidden">
                          {t(key)}
                        </TooltipContent>
                      </Tooltip>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sign out button */}
        <div className="shrink-0 border-t border-white/[0.06] px-3 py-3">
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-[8px] text-[13px] text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/70"
            >
              <LogOut className="h-[16px] w-[16px] shrink-0" strokeWidth={1.75} />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
