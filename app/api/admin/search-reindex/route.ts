import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  ensureIndex,
  upsertDocuments,
  postToDoc,
  programToDoc,
  projectToDoc,
  eventToDoc,
  careerToDoc,
  faqToDoc,
} from "@/lib/search/sync";
import { getMeiliClient } from "@/lib/search/client";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = getMeiliClient();
  if (!client) {
    return NextResponse.json(
      { error: "Meilisearch not configured. Set MEILISEARCH_HOST in .env." },
      { status: 503 },
    );
  }

  try {
    await ensureIndex();

    const [posts, programs, projects, events, careers, faqs] = await Promise.all([
      db.post.findMany({ where: { status: "PUBLISHED", deletedAt: null } }),
      db.program.findMany({ where: { status: "PUBLISHED", deletedAt: null } }),
      db.project.findMany({ where: { status: "PUBLISHED", deletedAt: null } }),
      db.event.findMany({ where: { isPublic: true, deletedAt: null } }),
      db.career.findMany({ where: { isActive: true } }),
      db.faq.findMany({ where: { isActive: true } }),
    ]);

    const docs = [
      ...posts.map(postToDoc),
      ...programs.map(programToDoc),
      ...projects.map(projectToDoc),
      ...events.map(eventToDoc),
      ...careers.map(careerToDoc),
      ...faqs.map(faqToDoc),
    ];

    await upsertDocuments(docs);

    return NextResponse.json({
      ok: true,
      indexed: docs.length,
      breakdown: {
        posts: posts.length,
        programs: programs.length,
        projects: projects.length,
        events: events.length,
        careers: careers.length,
        faqs: faqs.length,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Reindex failed" },
      { status: 500 },
    );
  }
}
