import { getMeiliClient, INDEXES, INDEX_SETTINGS, type SearchDocument } from "./client";

const INDEX_NAME = "content";

/** Ensure the shared content index exists with correct settings. */
export async function ensureIndex() {
  const client = getMeiliClient();
  if (!client) return;
  await client.createIndex(INDEX_NAME, { primaryKey: "id" });
  await client.index(INDEX_NAME).updateSettings(INDEX_SETTINGS);
}

/** Upsert one or more documents into the content index. */
export async function upsertDocuments(docs: SearchDocument[]) {
  const client = getMeiliClient();
  if (!client || docs.length === 0) return;
  await client.index(INDEX_NAME).addDocuments(docs, { primaryKey: "id" });
}

/** Delete a document from the content index by its composite id. */
export async function deleteDocument(id: string) {
  const client = getMeiliClient();
  if (!client) return;
  await client.index(INDEX_NAME).deleteDocument(id);
}

/** Full-text search across all content types. */
export async function searchContent(
  query: string,
  { types, limit = 20 }: { types?: string[]; limit?: number } = {},
): Promise<SearchDocument[]> {
  const client = getMeiliClient();
  if (!client) return [];
  const result = await client.index(INDEX_NAME).search<SearchDocument>(query, {
    limit,
    filter: types && types.length > 0 ? `type IN [${types.map((t) => `"${t}"`).join(", ")}]` : undefined,
    attributesToHighlight: ["title", "excerpt"],
    highlightPreTag: "<mark>",
    highlightPostTag: "</mark>",
  });
  return result.hits;
}

// ─── Per-entity sync helpers ─────────────────────────────────

export function postToDoc(post: {
  id: string;
  title: string;
  excerpt?: string | null;
  slug: string;
  publishedAt?: Date | null;
}): SearchDocument {
  return {
    id: `posts:${post.id}`,
    type: INDEXES.posts,
    title: post.title,
    excerpt: post.excerpt ?? undefined,
    slug: post.slug,
    publishedAt: post.publishedAt?.toISOString(),
  };
}

export function programToDoc(p: {
  id: string;
  title: string;
  summary: string;
  slug: string;
}): SearchDocument {
  return { id: `programs:${p.id}`, type: INDEXES.programs, title: p.title, excerpt: p.summary, slug: p.slug };
}

export function projectToDoc(p: {
  id: string;
  title: string;
  summary: string;
  slug: string;
}): SearchDocument {
  return { id: `projects:${p.id}`, type: INDEXES.projects, title: p.title, excerpt: p.summary, slug: p.slug };
}

export function eventToDoc(e: {
  id: string;
  title: string;
  description: string;
  slug: string;
  startsAt: Date;
}): SearchDocument {
  return {
    id: `events:${e.id}`,
    type: INDEXES.events,
    title: e.title,
    excerpt: e.description.slice(0, 200),
    slug: e.slug,
    publishedAt: e.startsAt.toISOString(),
  };
}

export function careerToDoc(c: {
  id: string;
  title: string;
  description: string;
  slug: string;
}): SearchDocument {
  return {
    id: `careers:${c.id}`,
    type: INDEXES.careers,
    title: c.title,
    excerpt: c.description.slice(0, 200),
    slug: c.slug,
  };
}

export function faqToDoc(f: {
  id: string;
  question: string;
  answer: string;
}): SearchDocument {
  return {
    id: `faqs:${f.id}`,
    type: INDEXES.faqs,
    title: f.question,
    excerpt: f.answer.replace(/<[^>]+>/g, "").slice(0, 200),
    slug: `faqs:${f.id}`,
  };
}
