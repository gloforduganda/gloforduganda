"use client";

import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Eye, X } from "lucide-react";
import { RichTextDisplay } from "@/components/ui/RichTextDisplay";
import { Button } from "@/components/ui/Button";

/**
 * Preview button + modal for rich-text HTML content.
 * Drop it next to any Save button in a form that has a `bodyHtml` state.
 */
export function ContentPreview({
  html,
  title,
}: {
  html: string;
  title?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button type="button" variant="outline" className="w-full gap-2">
          <Eye className="h-4 w-4" />
          Preview
        </Button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed inset-x-4 top-[5vh] z-50 mx-auto max-w-4xl max-h-[90vh] overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-card)] px-6 py-4">
            <div>
              <DialogPrimitive.Title className="text-base font-semibold">
                Content preview
              </DialogPrimitive.Title>
              {title && (
                <p className="mt-0.5 text-sm text-[var(--color-muted-fg)]">{title}</p>
              )}
            </div>
            <DialogPrimitive.Close asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="Close preview">
                <X className="h-4 w-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>

          <div className="p-6 sm:p-10">
            {html.trim() ? (
              <RichTextDisplay html={html} className="prose prose-neutral max-w-none dark:prose-invert" />
            ) : (
              <p className="text-center text-[var(--color-muted-fg)]">No content to preview yet.</p>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
