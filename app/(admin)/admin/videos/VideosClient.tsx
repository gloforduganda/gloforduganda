"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Pencil, Trash2, Eye, BarChart3, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import {
  ConfirmDialog, ConfirmDialogTrigger, ConfirmDialogContent,
  ConfirmDialogHeader, ConfirmDialogTitle, ConfirmDialogDescription,
  ConfirmDialogFooter, ConfirmDialogAction, ConfirmDialogCancel,
} from "@/components/ui/ConfirmDialog";
import { createVideoAction, updateVideoAction, deleteVideoAction, toggleVideoAction } from "./actions";
import { youtubeThumbnail } from "@/lib/utils/youtube";

type VideoRow = {
  id: string;
  title: string;
  youtubeId: string;
  youtubeUrl: string;
  description: string | null;
  thumbnailUrl: string | null;
  category: string;
  order: number;
  isPublished: boolean;
  _count: { views: number };
};

type Analytics = {
  totalViews: number;
  completions: number;
  completionRate: number;
  avgWatchedSec: number;
  avgPercentWatched: number;
  byDevice: Array<{ device: string; count: number }>;
  byCountry: Array<{ country: string; count: number }>;
};

export function VideosClient({ videos }: { videos: VideoRow[] }) {
  const [editing, setEditing] = useState<VideoRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [analyticsVideo, setAnalyticsVideo] = useState<VideoRow | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function openCreate() { setEditing(null); setShowForm(true); }
  function openEdit(v: VideoRow) { setEditing(v); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditing(null); setError(null); }

  async function loadAnalytics(video: VideoRow) {
    setAnalyticsVideo(video);
    setAnalyticsLoading(true);
    setAnalytics(null);
    try {
      const res = await fetch(`/api/admin/video-analytics?id=${video.id}`);
      const data = await res.json() as Analytics;
      setAnalytics(data);
    } catch {
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    start(async () => {
      try {
        if (editing) {
          formData.set("id", editing.id);
          formData.set("isPublished", String(editing.isPublished));
          await updateVideoAction(formData);
        } else {
          await createVideoAction(formData);
        }
        closeForm();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  const CATEGORIES = ["general", "programs", "events", "stories", "news", "education"];

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="rounded-[var(--radius-md)] border border-[var(--color-danger)] bg-[rgb(var(--token-danger)/0.08)] p-3 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Videos</h1>
          <p className="text-sm text-[var(--color-muted-fg)]">
            Manage YouTube videos shown on the public Videos page.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Video
        </Button>
      </header>

      {/* Form */}
      {showForm && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <h2 className="mb-4 text-lg font-semibold">{editing ? "Edit Video" : "Add Video"}</h2>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" name="title" required defaultValue={editing?.title ?? ""} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="youtubeUrl">YouTube URL *</Label>
                <Input id="youtubeUrl" name="youtubeUrl" required placeholder="https://youtube.com/watch?v=..." defaultValue={editing?.youtubeUrl ?? ""} />
                <p className="text-xs text-[var(--color-muted-fg)]">Supports youtube.com/watch, youtu.be, and Shorts URLs</p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={3} defaultValue={editing?.description ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  name="category"
                  defaultValue={editing?.category ?? "general"}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input id="order" name="order" type="number" min={0} defaultValue={editing?.order ?? 0} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="thumbnailUrl">Custom Thumbnail URL (optional)</Label>
                <Input id="thumbnailUrl" name="thumbnailUrl" placeholder="Leave blank to use YouTube thumbnail" defaultValue={editing?.thumbnailUrl ?? ""} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={pending}>{editing ? "Update" : "Add Video"}</Button>
              <Button type="button" variant="outline" size="sm" onClick={closeForm}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {/* Analytics panel */}
      {analyticsVideo && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <BarChart3 className="h-5 w-5 text-[var(--color-primary)]" />
              Analytics — {analyticsVideo.title}
            </h2>
            <Button variant="outline" size="sm" onClick={() => setAnalyticsVideo(null)}>Close</Button>
          </div>
          {analyticsLoading ? (
            <p className="text-sm text-[var(--color-muted-fg)]">Loading analytics…</p>
          ) : analytics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { icon: Eye, label: "Total Views", value: analytics.totalViews },
                  { icon: TrendingUp, label: "Completions", value: `${analytics.completions} (${analytics.completionRate}%)` },
                  { icon: Clock, label: "Avg Watch Time", value: `${analytics.avgWatchedSec}s` },
                  { icon: BarChart3, label: "Avg % Watched", value: `${analytics.avgPercentWatched}%` },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-[var(--radius-md)] bg-[var(--color-muted)] p-4 text-center">
                    <stat.icon className="mx-auto mb-1 h-5 w-5 text-[var(--color-primary)]" />
                    <p className="text-xl font-bold text-[var(--color-fg)]">{stat.value}</p>
                    <p className="text-xs text-[var(--color-muted-fg)]">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {analytics.byDevice.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">By Device</p>
                    {analytics.byDevice.map((d) => (
                      <div key={d.device} className="flex items-center justify-between py-1 text-sm">
                        <span className="capitalize">{d.device}</span>
                        <span className="font-medium">{d.count}</span>
                      </div>
                    ))}
                  </div>
                )}
                {analytics.byCountry.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">Top Countries</p>
                    {analytics.byCountry.slice(0, 5).map((c) => (
                      <div key={c.country} className="flex items-center justify-between py-1 text-sm">
                        <span>{c.country}</span>
                        <span className="font-medium">{c.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-[var(--color-muted-fg)]">
                Note: These are views from your website only, not YouTube&apos;s total view count.
              </p>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-muted-fg)]">No analytics data yet.</p>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[rgb(var(--token-muted)/0.50)] text-left text-xs uppercase tracking-wider text-[var(--color-muted-fg)]">
              <tr>
                <th className="px-4 py-3">Video</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {videos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[var(--color-muted-fg)]">
                    No videos yet. Add your first video above.
                  </td>
                </tr>
              ) : (
                videos.map((v) => {
                  const thumb = v.thumbnailUrl || youtubeThumbnail(v.youtubeId, "hq");
                  return (
                    <tr key={v.id} className="hover:bg-[rgb(var(--token-muted)/0.30)]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md bg-black">
                            <Image src={thumb} alt={v.title} fill className="object-cover" sizes="80px" />
                          </div>
                          <span className="font-medium line-clamp-2">{v.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize text-[var(--color-muted-fg)]">{v.category}</td>
                      <td className="px-4 py-3">{v._count.views}</td>
                      <td className="px-4 py-3">{v.order}</td>
                      <td className="px-4 py-3">
                        <form action={toggleVideoAction}>
                          <input type="hidden" name="id" value={v.id} />
                          <input type="hidden" name="isPublished" value={String(v.isPublished)} />
                          <button type="submit" className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${v.isPublished ? "bg-[rgb(var(--token-success)/0.20)] text-[var(--color-success)]" : "bg-[var(--color-muted)] text-[var(--color-muted-fg)]"}`}>
                            {v.isPublished ? "Published" : "Draft"}
                          </button>
                        </form>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => loadAnalytics(v)} title="Analytics">
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(v)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <ConfirmDialog>
                            <ConfirmDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                              </Button>
                            </ConfirmDialogTrigger>
                            <ConfirmDialogContent>
                              <ConfirmDialogHeader>
                                <ConfirmDialogTitle>Delete video</ConfirmDialogTitle>
                                <ConfirmDialogDescription>
                                  Remove &quot;{v.title}&quot;? This also deletes all analytics data.
                                </ConfirmDialogDescription>
                              </ConfirmDialogHeader>
                              <ConfirmDialogFooter>
                                <ConfirmDialogCancel>Cancel</ConfirmDialogCancel>
                                <ConfirmDialogAction onClick={async () => {
                                  const fd = new FormData();
                                  fd.set("id", v.id);
                                  await deleteVideoAction(fd);
                                  router.refresh();
                                }}>Delete</ConfirmDialogAction>
                              </ConfirmDialogFooter>
                            </ConfirmDialogContent>
                          </ConfirmDialog>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
