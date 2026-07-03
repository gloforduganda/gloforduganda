"use client";

import { useState, useTransition } from "react";
import { createPostAction, updatePostAction, deletePostAction } from "@/lib/actions/posts";
import { useConfirmAction } from "@/components/ui/useConfirmAction";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
  () => import("@/components/ui/RichTextEditor").then((m) => ({ default: m.RichTextEditor })),
  { ssr: false },
);
import { Button } from "@/components/ui/Button";
import { MediaPicker } from "@/components/ui/MediaPicker";
import { Textarea } from "@/components/ui/Textarea";
import { ContentPreview } from "@/components/ui/ContentPreview";
import type { Block } from "@/lib/blocks/types";

function blocksToHtml(blocks: Block[]): string {
  const rt = blocks.find((b) => b.type === "richText");
  return rt ? (rt.data as { html: string }).html : "";
}

function htmlToBlocks(html: string): Block[] {
  return [{ id: "body", type: "richText", data: { html } }];
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

type Initial = {
  id?: string;
  slug?: string;
  title?: string;
  excerpt?: string;
  body?: Block[];
  coverMediaId?: string;
  coverUrl?: string | null;
  tagSlugs?: string[];
};

export function PostForm({ initial }: { initial?: Initial }) {
  const isEdit = !!initial?.id;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugManual, setSlugManual] = useState(!!initial?.slug);
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [coverMediaId, setCoverMediaId] = useState(initial?.coverMediaId ?? "");
  const [coverUrl, setCoverUrl] = useState<string | null>(initial?.coverUrl ?? null);
  const [tagInput, setTagInput] = useState((initial?.tagSlugs ?? []).join(", "));
  const [bodyHtml, setBodyHtml] = useState(() => blocksToHtml(initial?.body ?? []));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const confirmAction = useConfirmAction();

  const submit = () => {
    setError(null);
    const tagSlugs = tagInput
      .split(",")
      .map((s) => s.trim().toLowerCase().replace(/\s+/g, "-"))
      .filter(Boolean);
    start(async () => {
      try {
        const payload = {
          title,
          slug,
          excerpt,
          body: htmlToBlocks(bodyHtml),
          coverMediaId: coverMediaId || null,
          tagSlugs,
          seoTitle: null,
          seoDesc: null,
        };
        if (isEdit) {
          await updatePostAction({ id: initial!.id!, ...payload });
        } else {
          await createPostAction(payload);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    });
  };

  const del = async () => {
    if (!initial?.id) return;
    const ok = await confirmAction({
      title: "Delete post",
      description: "Delete this post?",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    start(async () => {
      try {
        await deletePostAction({ id: initial.id });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete");
      }
    });
  };

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[1fr_280px]">
      <div className="min-w-0 space-y-6">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">Details</h2>
          <Field label="Title">
            <input value={title} onChange={(e) => { setTitle(e.target.value); if (!slugManual) setSlug(slugify(e.target.value)); }} placeholder="e.g. Q1 Impact Report: 12,400 Lives Touched" className={inputCls} />
          </Field>
          <Field label="Slug">
            <input value={slug} onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }} placeholder="e.g. q1-impact-report-2026" className={inputCls} />
          </Field>
          <Field label="Excerpt">
            <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} placeholder="A short summary shown in blog listings and social previews..." className={inputCls} />
          </Field>
          <Field label="Cover image">
            <MediaPicker
              value={coverMediaId}
              valueUrl={coverUrl}
              onChange={(p) => {
                setCoverMediaId(p?.id ?? "");
                setCoverUrl(p?.url ?? null);
              }}
              placeholder="Post cover"
            />
          </Field>
          <Field label="Tags" hint="Comma-separated, lowercase slugs. New tags are created automatically.">
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="e.g. health, youth, climate" className={inputCls} />
          </Field>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">Content</h2>
          <RichTextEditor html={bodyHtml} onChange={setBodyHtml} draftKey={initial?.id ?? "post-new"} />
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 space-y-3">
          {error ? (
            <p role="alert" className="rounded-[var(--radius-sm)] bg-[rgb(var(--token-danger)/0.10)] p-2 text-sm text-[var(--color-danger)]">
              {error}
            </p>
          ) : null}
          <Button onClick={submit} disabled={pending} className="w-full">
            {pending ? "Saving\u2026" : isEdit ? "Save changes" : "Create post"}
          </Button>
          <ContentPreview html={bodyHtml} title={title} />
          {isEdit ? (
            <Button variant="outline" onClick={del} disabled={pending} className="w-full">
              Delete post
            </Button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

const inputCls =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {hint ? <span className="block text-xs text-[var(--color-muted-fg)]">{hint}</span> : null}
      {children}
    </label>
  );
}
