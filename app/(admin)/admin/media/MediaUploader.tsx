"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

export function MediaUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ name: string; status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handlePick = () => inputRef.current?.click();

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setProgress({ name: file.name, status: "Uploading\u2026" });
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/media/presign", { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
      setProgress(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setProgress(null);
    }
  }, [router]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        "rounded-[var(--radius-lg)] border-2 border-dashed p-8 transition-colors",
        dragging
          ? "border-[var(--color-primary)] bg-[rgb(var(--token-primary)/0.05)]"
          : "border-[var(--color-border)] bg-[rgb(var(--token-muted)/0.40)]",
      )}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className={cn(
          "grid h-14 w-14 place-items-center rounded-2xl transition-colors",
          dragging
            ? "bg-[rgb(var(--token-primary)/0.12)] text-[var(--color-primary)]"
            : "bg-[var(--color-muted)] text-[var(--color-muted-fg)]",
        )}>
          <CloudUpload className="h-7 w-7" />
        </div>
        <div>
          <p className="font-medium text-[var(--color-fg)]">
            {dragging ? "Drop your file here" : "Upload media"}
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
            Drag & drop or click to choose. Images or PDFs, up to 25 MB.
          </p>
        </div>
        <Button type="button" size="sm" onClick={handlePick} disabled={!!progress}>
          <Upload className="h-4 w-4" /> Choose file
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml,application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
      {progress ? (
        <p className="mt-4 text-center text-sm text-[var(--color-muted-fg)]">
          {progress.name}: {progress.status}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-4 text-center text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
