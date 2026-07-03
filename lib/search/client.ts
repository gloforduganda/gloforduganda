import { Meilisearch } from "meilisearch";

const host = process.env.MEILISEARCH_HOST;
const apiKey = process.env.MEILISEARCH_API_KEY;

/** Returns null when Meilisearch is not configured — all callers must handle this. */
export function getMeiliClient(): Meilisearch | null {
  if (!host) return null;
  return new Meilisearch({ host, apiKey });
}

// ─── Index names ────────────────────────────────────────────
export const INDEXES = {
  posts: "posts",
  programs: "programs",
  projects: "projects",
  events: "events",
  careers: "careers",
  faqs: "faqs",
} as const;

export type SearchIndex = (typeof INDEXES)[keyof typeof INDEXES];

// ─── Shared document shape ───────────────────────────────────
export interface SearchDocument {
  id: string;
  type: SearchIndex;
  title: string;
  excerpt?: string;
  slug: string;
  /** ISO date string */
  publishedAt?: string;
}

// ─── Index settings (applied once at setup) ─────────────────
export const INDEX_SETTINGS = {
  searchableAttributes: ["title", "excerpt"],
  displayedAttributes: ["id", "type", "title", "excerpt", "slug", "publishedAt"],
  sortableAttributes: ["publishedAt"],
  filterableAttributes: ["type"],
};
