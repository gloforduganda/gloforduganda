"use client";

import { useState, useTransition } from "react";
import {
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
} from "@/lib/actions/projects";
import { useConfirmAction } from "@/components/ui/useConfirmAction";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
  () => import("@/components/ui/RichTextEditor").then((m) => ({ default: m.RichTextEditor })),
  { ssr: false },
);
import { Button } from "@/components/ui/Button";
import { MediaPicker } from "@/components/ui/MediaPicker";
import { Textarea } from "@/components/ui/Textarea";
import type { Block } from "@/lib/blocks/types";

function blocksToHtml(blocks: Block[]): string {
  const rt = blocks.find((b) => b.type === "richText");
  return rt ? (rt.data as { html: string }).html : "";
}
function htmlToBlocks(html: string): Block[] {
  return [{ id: "body", type: "richText", data: { html } }];
}

type Initial = {
  id?: string;
  slug?: string;
  title?: string;
  summary?: string;
  body?: Block[];
  coverMediaId?: string;
  coverUrl?: string | null;
  order?: number;
};

export function ProjectForm({ initial }: { initial?: Initial }) {
  const isEdit = !!initial?.id;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [coverMediaId, setCoverMediaId] = useState(initial?.coverMediaId ?? "");
  const [coverUrl, setCoverUrl] = useState<string | null>(initial?.coverUrl ?? null);
  const [order, setOrder] = useState(initial?.order ?? 0);
  const [bodyHtml, setBodyHtml] = useState(() => blocksToHtml(initial?.body ?? []));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const confirmAction = useConfirmAction();

  const submit = () => {
    setError(null);
    start(async () => {
      try {
        const payload = {
          title,
          slug,
          summary,
          body: htmlToBlocks(bodyHtml),
          coverMediaId: coverMediaId || null,
          order: Number(order),
          seoTitle: null,
          seoDesc: null,
        };
        if (isEdit) {
          await updateProjectAction({ id: initial!.id!, ...payload });
        } else {
          await createProjectAction(payload);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    });
  };

  const del = async () => {
    if (!initial?.id) return;
    const ok = await confirmAction({
      title: "Delete project",
      description: "Delete this project? This action cannot be undone.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    start(async () => {
      try {
        await deleteProjectAction({ id: initial.id });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete");
      }
    });
  };

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-6">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">Details</h2>
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Borehole Drilling — Soroti District" className={inputCls} />
          </Field>
          <Field label="Slug">
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. borehole-drilling-soroti" className={inputCls} />
          </Field>
          <Field label="Summary" hint="Short description shown in listings">
            <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} placeholder="A short description shown in project listings..." className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cover image">
              <MediaPicker
                value={coverMediaId}
                valueUrl={coverUrl}
                onChange={(p) => {
                  setCoverMediaId(p?.id ?? "");
                  setCoverUrl(p?.url ?? null);
                }}
                placeholder="Project cover"
              />
            </Field>
            <Field label="Order" hint="Lower number = shown first">
              <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} className={inputCls} />
            </Field>
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">Content</h2>
          <RichTextEditor html={bodyHtml} onChange={setBodyHtml} />
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
            {pending ? "Saving\u2026" : isEdit ? "Save changes" : "Create project"}
          </Button>
          {isEdit ? (
            <Button variant="outline" onClick={del} disabled={pending} className="w-full">
              Delete project
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
