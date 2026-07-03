/**
 * Cache tag conventions for single-tenant deploys.
 *
 * Reads use `unstable_cache` with these tags. Admin mutations call
 * `revalidateTag(tag)` via the service layer so public pages update
 * without client-side fetching.
 */

export const tags = {
  theme: () => `theme`,
  siteSettings: () => `site-settings`,
  nav: (location: string) => `nav:${location}`,
  pages: () => `pages`,
  page: (slug: string) => `page:${slug}`,
  programs: () => `programs`,
  program: (slug: string) => `program:${slug}`,
  posts: () => `posts`,
  post: (slug: string) => `post:${slug}`,
  projects: () => `projects`,
  project: (slug: string) => `project:${slug}`,
  campaigns: () => `campaigns`,
  featureFlags: () => `feature-flags`,
  siteVisits: () => `site-visits`,
} as const;
