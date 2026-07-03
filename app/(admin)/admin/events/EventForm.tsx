"use client";

import { useState, useTransition } from "react";
import {
  createEventAction,
  updateEventAction,
  deleteEventAction,
} from "@/lib/actions/events";
import { Button } from "@/components/ui/Button";
import { useConfirmAction } from "@/components/ui/useConfirmAction";
import { MediaPicker } from "@/components/ui/MediaPicker";
import { ContentPreview } from "@/components/ui/ContentPreview";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/Select";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
  () => import("@/components/ui/RichTextEditor").then((m) => ({ default: m.RichTextEditor })),
  { ssr: false },
);

type SegmentOption = { id: string; name: string };

type Initial = {
  id?: string;
  slug?: string;
  title?: string;
  description?: string;
  descriptionBlocks?: Array<{ id: string; type: string; data: unknown }>;
  startsAt?: string;
  endsAt?: string | null;
  location?: string | null;
  coverMediaId?: string | null;
  coverUrl?: string | null;
  isPublic?: boolean;
  status?: string;
  segmentIds?: string[];
  seoTitle?: string | null;
  seoDesc?: string | null;
};

function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function blocksToHtml(blocks?: Array<{ id: string; type: string; data: unknown }>): string {
  if (!blocks) return "";
  const rt = blocks.find((b) => b.type === "richText");
  return rt ? (rt.data as { html: string }).html : "";
}

function htmlToBlocks(html: string) {
  return [{ id: "body", type: "richText", data: { html } }];
}

export function EventForm({ initial, segments = [] }: { initial?: Initial; segments?: SegmentOption[] }) {
  const isEdit = !!initial?.id;
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [descHtml, setDescHtml] = useState(() => blocksToHtml(initial?.descriptionBlocks) || initial?.description || "");
  const [startsAt, setStartsAt] = useState(toLocalInput(initial?.startsAt));
  const [endsAt, setEndsAt] = useState(toLocalInput(initial?.endsAt));
  const [location, setLocation] = useState(initial?.location ?? "");
  const [coverMediaId, setCoverMediaId] = useState(initial?.coverMediaId ?? "");
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl ?? "");
  const [status, setStatus] = useState(initial?.status ?? "PUBLISHED");
  const [selectedSegments, setSelectedSegments] = useState<string[]>(initial?.segmentIds ?? []);
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [seoDesc, setSeoDesc] = useState(initial?.seoDesc ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const confirmAction = useConfirmAction();

  const submit = () => {
    setError(null);
    start(async () => {
      try {
        const payload = {
          slug,
          title,
          description: descHtml.replace(/<[^>]+>/g, "").slice(0, 500),
          descriptionBlocks: htmlToBlocks(descHtml),
          startsAt: startsAt ? new Date(startsAt).toISOString() : null,
          endsAt: endsAt ? new Date(endsAt).toISOString() : null,
          location: location || null,
          coverMediaId: coverMediaId || null,
          status,
          isPublic: status === "PUBLISHED",
          segmentIds: selectedSegments,
          seoTitle: seoTitle || null,
          seoDesc: seoDesc || null,
        };
        if (isEdit) await updateEventAction({ id: initial!.id!, ...payload });
        else await createEventAction(payload);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    });
  };

  const del = async () => {
    if (!initial?.id) return;
    const ok = await confirmAction({
      title: "Delete event",
      description: "Delete this event? All notifications will also be removed.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    start(async () => {
      try {
        await deleteEventAction({ id: initial.id });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete");
      }
    });
  };

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        <section className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">Details</h2>
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Annual Community Gathering 2026" className={inputCls} />
          </Field>
          <Field label="Slug">
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. annual-community-gathering-2026" className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts at">
              <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Ends at (optional)">
              <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label="Location (optional)">
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Kampala Serena Hotel" className={inputCls} />
          </Field>
          <Field label="Cover image (optional)">
            <MediaPicker
              value={coverMediaId}
              valueUrl={coverUrl}
              onChange={(picked) => {
                setCoverMediaId(picked?.id ?? "");
                setCoverUrl(picked?.url ?? "");
              }}
              placeholder="Event cover"
            />
          </Field>
          <Field label="Notification segments">
            {segments.length === 0 ? (
              <p className="text-xs text-[var(--color-muted-fg)]">No segments created yet. All active subscribers will be notified.</p>
            ) : (
              <div className="space-y-1">
                {segments.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedSegments.includes(s.id)}
                      onChange={() =>
                        setSelectedSegments((prev) =>
                          prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id],
                        )
                      }
                    />
                    {s.name}
                  </label>
                ))}
                <p className="text-xs text-[var(--color-muted-fg)]">
                  {selectedSegments.length === 0 ? "All active subscribers" : `${selectedSegments.length} segment${selectedSegments.length === 1 ? "" : "s"} selected`}
                </p>
              </div>
            )}
          </Field>
        </section>

        <section className="space-y-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">Description</h2>
          <RichTextEditor html={descHtml} onChange={setDescHtml} draftKey={initial?.id ?? "event-new"} />
        </section>

        <section className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">SEO</h2>
          <Field label="SEO title">
            <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Overrides page title in search results" className={inputCls} />
          </Field>
          <Field label="SEO description">
            <textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} rows={3} placeholder="Short description for search engines..." className={inputCls + " resize-y"} />
          </Field>
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          {error ? (
            <p role="alert" className="rounded-[var(--radius-sm)] bg-[rgb(var(--token-danger)/0.10)] p-2 text-sm text-[var(--color-danger)]">
              {error}
            </p>
          ) : null}
          <div className="space-y-1.5">
            <span className="text-sm font-medium">Status</span>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full" aria-label="Event status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="REVIEW">In review</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={submit} disabled={pending} className="w-full">
            {pending ? "Saving\u2026" : isEdit ? "Save changes" : "Create event"}
          </Button>
          <ContentPreview html={descHtml} title={title} />
          {isEdit ? (
            <Button variant="outline" onClick={del} disabled={pending} className="w-full">
              Delete event
            </Button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

const inputCls =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
