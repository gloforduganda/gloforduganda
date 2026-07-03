import { z } from "zod";
import { cuid, slug } from "./common";
import { blocksSchema } from "@/lib/blocks/types";

export const projectCreateSchema = z.object({
  slug,
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().min(1).max(600),
  body: blocksSchema.optional().default([]),
  coverMediaId: z.string().optional().nullable(),
  order: z.number().int().min(0).max(9999).default(0),
  seoTitle: z.string().trim().max(200).optional().nullable(),
  seoDesc: z.string().trim().max(400).optional().nullable(),
});

export const projectUpdateSchema = projectCreateSchema.partial().extend({ id: cuid });

export const projectStatusSchema = z.object({
  id: cuid,
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]),
});

export const projectDeleteSchema = z.object({ id: cuid });
