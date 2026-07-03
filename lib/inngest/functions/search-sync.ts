import { inngest } from "@/lib/inngest/client";
import { db } from "@/lib/db";
import {
  upsertDocuments,
  deleteDocument,
  postToDoc,
  programToDoc,
  projectToDoc,
  eventToDoc,
  careerToDoc,
  faqToDoc,
} from "@/lib/search/sync";

/**
 * Listens to audit/log events and syncs the affected entity to Meilisearch.
 * Only runs when MEILISEARCH_HOST is configured.
 */
export const searchSync = inngest.createFunction(
  { id: "search-sync", name: "Search: sync content to Meilisearch" },
  { event: "audit/log" },
  async ({ event }) => {
    if (!process.env.MEILISEARCH_HOST) return { skipped: true };

    const { entityType, entityId, action } = event.data as {
      entityType?: string;
      entityId?: string;
      action?: string;
    };

    if (!entityType || !entityId) return { skipped: true };

    const isDelete = action === "delete";

    switch (entityType) {
      case "Post": {
        if (isDelete) { await deleteDocument(`posts:${entityId}`); break; }
        const post = await db.post.findUnique({ where: { id: entityId }, select: { id: true, title: true, excerpt: true, slug: true, publishedAt: true, status: true } });
        if (!post || post.status !== "PUBLISHED") { await deleteDocument(`posts:${entityId}`); break; }
        await upsertDocuments([postToDoc(post)]);
        break;
      }
      case "Program": {
        if (isDelete) { await deleteDocument(`programs:${entityId}`); break; }
        const program = await db.program.findUnique({ where: { id: entityId }, select: { id: true, title: true, summary: true, slug: true, status: true } });
        if (!program || program.status !== "PUBLISHED") { await deleteDocument(`programs:${entityId}`); break; }
        await upsertDocuments([programToDoc(program)]);
        break;
      }
      case "Project": {
        if (isDelete) { await deleteDocument(`projects:${entityId}`); break; }
        const project = await db.project.findUnique({ where: { id: entityId }, select: { id: true, title: true, summary: true, slug: true, status: true } });
        if (!project || project.status !== "PUBLISHED") { await deleteDocument(`projects:${entityId}`); break; }
        await upsertDocuments([projectToDoc(project)]);
        break;
      }
      case "Event": {
        if (isDelete) { await deleteDocument(`events:${entityId}`); break; }
        const ev = await db.event.findUnique({ where: { id: entityId }, select: { id: true, title: true, description: true, slug: true, startsAt: true, isPublic: true } });
        if (!ev || !ev.isPublic) { await deleteDocument(`events:${entityId}`); break; }
        await upsertDocuments([eventToDoc(ev)]);
        break;
      }
      case "Career": {
        if (isDelete) { await deleteDocument(`careers:${entityId}`); break; }
        const career = await db.career.findUnique({ where: { id: entityId }, select: { id: true, title: true, description: true, slug: true, isActive: true } });
        if (!career || !career.isActive) { await deleteDocument(`careers:${entityId}`); break; }
        await upsertDocuments([careerToDoc(career)]);
        break;
      }
      case "Faq": {
        if (isDelete) { await deleteDocument(`faqs:${entityId}`); break; }
        const faq = await db.faq.findUnique({ where: { id: entityId }, select: { id: true, question: true, answer: true, isActive: true } });
        if (!faq || !faq.isActive) { await deleteDocument(`faqs:${entityId}`); break; }
        await upsertDocuments([faqToDoc(faq)]);
        break;
      }
    }

    return { synced: entityType, id: entityId };
  },
);
