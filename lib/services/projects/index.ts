import { revalidateTag, unstable_cache } from "next/cache";
import { createService } from "@/lib/services/_shared";
import {
  projectCreateSchema,
  projectUpdateSchema,
  projectStatusSchema,
  projectDeleteSchema,
} from "@/lib/validators/projects";
import { NotFoundError } from "@/lib/errors";
import { tags } from "@/lib/cache";
import { db } from "@/lib/db";

export const createProject = createService({
  module: "projects",
  action: "create",
  schema: projectCreateSchema,
  permission: () => ({ type: "Project" }),
  exec: async ({ input, tx }) => {
    const row = await tx.project.create({
      data: {
        slug: input.slug,
        title: input.title,
        summary: input.summary,
        body: input.body as never,
        coverMediaId: input.coverMediaId ?? undefined,
        order: input.order,
        seoTitle: input.seoTitle ?? null,
        seoDesc: input.seoDesc ?? null,
      },
    });
    revalidateTag(tags.projects());
    return row;
  },
  version: (out) => ({ entityType: "Project", entityId: out.id }),
});

export const updateProject = createService({
  module: "projects",
  action: "update",
  schema: projectUpdateSchema,
  permission: () => ({ type: "Project" }),
  loadBefore: async ({ input, tx }) => tx.project.findUnique({ where: { id: input.id } }),
  exec: async ({ input, tx }) => {
    const { id, ...rest } = input;
    const row = await tx.project.update({
      where: { id },
      data: {
        ...(rest.slug !== undefined && { slug: rest.slug }),
        ...(rest.title !== undefined && { title: rest.title }),
        ...(rest.summary !== undefined && { summary: rest.summary }),
        ...(rest.body !== undefined && { body: rest.body as never }),
        ...(rest.coverMediaId !== undefined && { coverMediaId: rest.coverMediaId }),
        ...(rest.order !== undefined && { order: rest.order }),
        ...("seoTitle" in rest && { seoTitle: rest.seoTitle ?? null }),
        ...("seoDesc" in rest && { seoDesc: rest.seoDesc ?? null }),
      },
    });
    revalidateTag(tags.projects());
    revalidateTag(tags.project(row.slug));
    return row;
  },
  version: (out) => ({ entityType: "Project", entityId: out.id }),
});

export const setProjectStatus = createService({
  module: "projects",
  action: "publish",
  schema: projectStatusSchema,
  permission: () => ({ type: "Project" }),
  loadBefore: async ({ input, tx }) => tx.project.findUnique({ where: { id: input.id } }),
  exec: async ({ input, tx }) => {
    const row = await tx.project.update({
      where: { id: input.id },
      data: { status: input.status },
    });
    revalidateTag(tags.projects());
    revalidateTag(tags.project(row.slug));
    return row;
  },
  version: (out) => ({ entityType: "Project", entityId: out.id }),
});

export const deleteProject = createService({
  module: "projects",
  action: "delete",
  schema: projectDeleteSchema,
  permission: () => ({ type: "Project" }),
  exec: async ({ input, tx }) => {
    const row = await tx.project.update({
      where: { id: input.id },
      data: { deletedAt: new Date() },
    });
    revalidateTag(tags.projects());
    revalidateTag(tags.project(row.slug));
    return { id: row.id };
  },
});

export function listProjects() {
  return db.project.findMany({
    where: { deletedAt: null },
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
    select: { id: true, slug: true, title: true, status: true, order: true, updatedAt: true },
  });
}

export function getProjectForEdit(id: string) {
  return db.project.findUnique({
    where: { id, deletedAt: null },
    include: { cover: { select: { id: true, url: true } } },
  });
}

export function listPublishedProjects() {
  return unstable_cache(
    async () =>
      db.project.findMany({
        where: { status: "PUBLISHED", deletedAt: null },
        orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
        select: { id: true, slug: true, title: true, summary: true, coverMediaId: true, cover: { select: { url: true, alt: true } } },
      }),
    ["projects-pub"],
    { tags: [tags.projects()], revalidate: 3600 },
  )();
}

export function getPublishedProjectBySlug(s: string) {
  return unstable_cache(
    async () => {
      const row = await db.project.findFirst({
        where: { slug: s, status: "PUBLISHED", deletedAt: null },
        include: { cover: { select: { url: true, alt: true } } },
      });
      if (!row) throw new NotFoundError("Project");
      return row;
    },
    ["project-pub", s],
    { tags: [tags.project(s), tags.projects()], revalidate: 3600 },
  )();
}
