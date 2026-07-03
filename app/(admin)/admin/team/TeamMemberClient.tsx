"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { ImagePicker } from "@/components/ui/ImagePicker";
import {
  ConfirmDialog, ConfirmDialogTrigger, ConfirmDialogContent,
  ConfirmDialogHeader, ConfirmDialogTitle, ConfirmDialogDescription,
  ConfirmDialogFooter, ConfirmDialogAction, ConfirmDialogCancel,
} from "@/components/ui/ConfirmDialog";
import {
  createTeamMemberAction,
  updateTeamMemberAction,
  deleteTeamMemberAction,
  toggleTeamMemberAction,
} from "./actions";

type Member = {
  id: string;
  name: string;
  role: string;
  department: string | null;
  bio: string | null;
  photoUrl: string | null;
  email: string | null;
  order: number;
  isActive: boolean;
  socialLinks: Record<string, string>;
};

export function TeamMemberClient({ members }: { members: Member[] }) {
  const [editing, setEditing] = useState<Member | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function openCreate() { setEditing(null); setPhotoUrl(null); setShowForm(true); }
  function openEdit(m: Member) { setEditing(m); setPhotoUrl(m.photoUrl); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditing(null); setPhotoUrl(null); setError(null); }

  async function handleSubmit(formData: FormData) {
    setError(null);
    start(async () => {
      try {
        if (editing) {
          formData.set("id", editing.id);
          formData.set("isActive", String(editing.isActive));
          await updateTeamMemberAction(formData);
        } else {
          await createTeamMemberAction(formData);
        }
        closeForm();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  const socials = (editing?.socialLinks ?? {}) as Record<string, string>;

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="rounded-[var(--radius-md)] border border-[var(--color-danger)] bg-[rgb(var(--token-danger)/0.08)] p-3 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team Members</h1>
          <p className="text-sm text-[var(--color-muted-fg)]">
            Manage team members shown on the public Leadership page.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Member
        </Button>
      </header>

      {showForm && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <h2 className="mb-4 text-lg font-semibold">{editing ? "Edit Member" : "New Member"}</h2>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" name="name" required defaultValue={editing?.name ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role / Title *</Label>
                <Input id="role" name="role" required defaultValue={editing?.role ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" name="department" defaultValue={editing?.department ?? ""} placeholder="e.g. Leadership, Board, Staff" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={editing?.email ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input id="order" name="order" type="number" min={0} defaultValue={editing?.order ?? 0} />
              </div>
              <div className="space-y-2">
                <Label>Photo</Label>
                <ImagePicker value={photoUrl} onChange={setPhotoUrl} placeholder="Member photo" aspect="1/1" />
                <input type="hidden" name="photoUrl" value={photoUrl ?? ""} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" name="bio" rows={3} defaultValue={editing?.bio ?? ""} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">Social Links</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {(["linkedin", "twitter", "instagram", "facebook", "website"] as const).map((key) => (
                  <div key={key} className="space-y-1">
                    <Label htmlFor={`social_${key}`} className="capitalize">{key}</Label>
                    <Input id={`social_${key}`} name={`social_${key}`} placeholder={`https://...`} defaultValue={socials[key] ?? ""} />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={pending}>{editing ? "Update" : "Create"}</Button>
              <Button type="button" variant="outline" size="sm" onClick={closeForm}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[rgb(var(--token-muted)/0.50)] text-left text-xs uppercase tracking-wider text-[var(--color-muted-fg)]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[var(--color-muted-fg)]">
                    <Users className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    No team members yet.
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="hover:bg-[rgb(var(--token-muted)/0.30)]">
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">{m.role}</td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">{m.department ?? "—"}</td>
                    <td className="px-4 py-3">{m.order}</td>
                    <td className="px-4 py-3">
                      <form action={toggleTeamMemberAction}>
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="isActive" value={String(m.isActive)} />
                        <button type="submit" className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${m.isActive ? "bg-[rgb(var(--token-success)/0.20)] text-[var(--color-success)]" : "bg-[var(--color-muted)] text-[var(--color-muted-fg)]"}`}>
                          {m.isActive ? "Active" : "Inactive"}
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
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
                              <ConfirmDialogTitle>Delete team member</ConfirmDialogTitle>
                              <ConfirmDialogDescription>
                                Remove &quot;{m.name}&quot; from the team? This cannot be undone.
                              </ConfirmDialogDescription>
                            </ConfirmDialogHeader>
                            <ConfirmDialogFooter>
                              <ConfirmDialogCancel>Cancel</ConfirmDialogCancel>
                              <ConfirmDialogAction onClick={async () => {
                                const fd = new FormData();
                                fd.set("id", m.id);
                                await deleteTeamMemberAction(fd);
                                router.refresh();
                              }}>Delete</ConfirmDialogAction>
                            </ConfirmDialogFooter>
                          </ConfirmDialogContent>
                        </ConfirmDialog>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
