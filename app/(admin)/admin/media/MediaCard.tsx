"use client";

import { useTransition } from "react";
import { Trash2, Copy, Check, ImageIcon } from "lucide-react";
import { useState } from "react";
import { deleteMediaAction, toggleGalleryAction } from "@/lib/actions/media";
import { cn } from "@/lib/utils/cn";
import { useConfirmAction } from "@/components/ui/useConfirmAction";

type Item = {
  id: string;
  url: string;
  mime: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  showInGallery: boolean;
};

export function MediaCard({ item }: { item: Item }) {
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);
  const confirmAction = useConfirmAction();

  const copy = async () => {
    await navigator.clipboard.writeText(item.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const del = async () => {
    const ok = await confirmAction({
      title: "Delete media",
      description: "Delete this media file?",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    start(() => deleteMediaAction({ id: item.id }));
  };

  const toggleGallery = () => {
    start(() => toggleGalleryAction(item.id, !item.showInGallery));
  };

  return (
    <figure className={cn(
      "group relative overflow-hidden rounded-[var(--radius-md)] border bg-[var(--color-card)] transition-shadow hover:shadow-md",
      item.showInGallery
        ? "border-[var(--color-primary)] ring-2 ring-[rgb(var(--token-primary)/0.20)]"
        : "border-[var(--color-border)]",
    )}>
      <div className="aspect-square bg-[var(--color-muted)]">
        {item.mime.startsWith("image/") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt={item.alt ?? ""} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-[var(--color-muted-fg)]">
            {item.mime}
          </div>
        )}
      </div>

      {/* Gallery badge */}
      {item.showInGallery && (
        <div className="absolute left-2 top-2 rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[10px] font-semibold text-white shadow">
          Gallery
        </div>
      )}

      <figcaption className={cn("flex items-center justify-between gap-1 p-2", pending && "opacity-50")}>
        <button
          onClick={copy}
          aria-label="Copy media id"
          className="inline-flex items-center gap-1 truncate rounded-[var(--radius-sm)] px-2 py-1 text-xs hover:bg-[var(--color-muted)]"
          title={item.id}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          <span className="truncate font-mono">{item.id.slice(0, 8)}&hellip;</span>
        </button>
        <div className="flex items-center gap-0.5">
          {item.mime.startsWith("image/") && (
            <button
              onClick={toggleGallery}
              disabled={pending}
              aria-label={item.showInGallery ? "Remove from gallery" : "Add to gallery"}
              title={item.showInGallery ? "Remove from gallery" : "Add to gallery"}
              className={cn(
                "rounded-[var(--radius-sm)] p-1.5 transition-colors",
                item.showInGallery
                  ? "text-[var(--color-primary)] hover:bg-[rgb(var(--token-primary)/0.10)]"
                  : "text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)] hover:text-[var(--color-fg)]",
              )}
            >
              <ImageIcon className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={del}
            disabled={pending}
            aria-label="Delete media"
            className="rounded-[var(--radius-sm)] p-1.5 text-[var(--color-danger)] hover:bg-[rgb(var(--token-danger)/0.10)]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </figcaption>
    </figure>
  );
}
