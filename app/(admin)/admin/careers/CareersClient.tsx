"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Trash2, Users, Briefcase, Settings2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  ConfirmDialog, ConfirmDialogTrigger, ConfirmDialogContent,
  ConfirmDialogHeader, ConfirmDialogTitle, ConfirmDialogDescription,
  ConfirmDialogFooter, ConfirmDialogAction, ConfirmDialogCancel,
} from "@/components/ui/ConfirmDialog";
import { DatePicker } from "@/components/ui/DatePicker";
import { createCareerAction, updateCareerAction, deleteCareerAction, toggleCareerAction } from "./actions";

const JOB_TYPES = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERNSHIP", label: "Internship" },
  { value: "VOLUNTEER", label: "Volunteer" },
] as const;

const FIELD_TYPES = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "select", label: "Dropdown" },
  { value: "file", label: "File Upload" },
] as const;

type CustomField = { id: string; label: string; type: string; required: boolean; options?: string[] };

type Career = {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  qualifications: string[];
  benefits: string[];
  customFields: CustomField[];
  notificationEmail: string | null;
  salaryRange: string | null;
  applicationDeadline: Date | string | null;
  isActive: boolean;
  _count: { applications: number };
};

function CustomFieldsBuilder({
  fields,
  onChange,
}: {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
}) {
  function addField() {
    onChange([
      ...fields,
      { id: `field_${Date.now()}`, label: "", type: "text", required: false },
    ]);
  }

  function updateField(i: number, patch: Partial<CustomField>) {
    const next = [...fields];
    next[i] = { ...next[i]!, ...patch };
    onChange(next);
  }

  function removeField(i: number) {
    onChange(fields.filter((_, j) => j !== i));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Custom Application Fields</Label>
        <Button type="button" variant="outline" size="sm" onClick={addField}>
          <Plus className="h-3.5 w-3.5" /> Add Field
        </Button>
      </div>
      {fields.length === 0 && (
        <p className="text-xs text-[var(--color-muted-fg)]">
          No custom fields. Add fields to collect additional info from applicants (e.g. ID number, photo, references).
        </p>
      )}
      {fields.map((field, i) => (
        <div key={field.id} className="rounded-lg border border-[var(--color-border)] bg-[rgb(var(--token-muted)/0.30)] p-3">
          <div className="flex items-start gap-2">
            <GripVertical className="mt-2.5 h-4 w-4 shrink-0 text-[var(--color-muted-fg)]" />
            <div className="flex-1 space-y-2">
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Input
                    placeholder="Field label (e.g. National ID Number)"
                    value={field.label}
                    onChange={(e) => updateField(i, { label: e.target.value })}
                  />
                </div>
                <select
                  value={field.type}
                  onChange={(e) => updateField(i, { type: e.target.value })}
                  className="rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              {field.type === "select" && (
                <Input
                  placeholder="Options (comma-separated, e.g. Yes,No,Maybe)"
                  value={field.options?.join(",") ?? ""}
                  onChange={(e) => updateField(i, { options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                />
              )}
              <label className="flex items-center gap-2 text-xs text-[var(--color-muted-fg)]">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => updateField(i, { required: e.target.checked })}
                  className="h-3.5 w-3.5 rounded"
                />
                Required field
              </label>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => removeField(i)}>
              <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CareersClient({ careers }: { careers: Career[] }) {
  const [editing, setEditing] = useState<Career | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "details" | "custom">("basic");
  const [error, setError] = useState<string | null>(null);
  const [deadline, setDeadline] = useState("");
  const [jobType, setJobType] = useState("FULL_TIME");
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const router = useRouter();

  useEffect(() => {
    setDeadline(editing ? formatDate(editing.applicationDeadline) : "");
    setJobType(editing?.type ?? "FULL_TIME");
    setCustomFields(editing?.customFields ?? []);
    setActiveTab("basic");
  }, [editing]);

  function openCreate() { setEditing(null); setShowForm(true); }
  function openEdit(c: Career) { setEditing(c); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditing(null); setError(null); }

  async function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("customFields", JSON.stringify(customFields));
    try {
      if (editing) {
        formData.set("id", editing.id);
        await updateCareerAction(formData);
      } else {
        await createCareerAction(formData);
      }
      closeForm();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  function formatDate(d: Date | string | null): string {
    if (!d) return "";
    return new Date(d).toISOString().split("T")[0] ?? "";
  }

  function formatTypeLabel(type: string): string {
    return JOB_TYPES.find((t) => t.value === type)?.label ?? type;
  }

  const TABS = [
    { id: "basic" as const, label: "Basic Info" },
    { id: "details" as const, label: "Details & Lists" },
    { id: "custom" as const, label: "Custom Fields" },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="rounded-[var(--radius-md)] border border-[var(--color-danger)] bg-[rgb(var(--token-danger)/0.08)] p-3 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Careers</h1>
          <p className="text-sm text-[var(--color-muted-fg)]">Manage job listings and review applications.</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Position
        </Button>
      </header>

      {showForm && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{editing ? "Edit Position" : "New Position"}</h2>
            {/* Tabs */}
            <div className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-0.5">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    activeTab === tab.id
                      ? "bg-white text-[var(--color-fg)] shadow-sm"
                      : "text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <form action={handleSubmit} className="space-y-4">
            {/* Hidden fields always submitted */}
            <input type="hidden" name="type" value={jobType} />
            <input type="hidden" name="customFields" value={JSON.stringify(customFields)} />

            {/* ── Tab: Basic Info ── */}
            {activeTab === "basic" && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input id="title" name="title" required defaultValue={editing?.title ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Input id="department" name="department" required defaultValue={editing?.department ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input id="location" name="location" required defaultValue={editing?.location ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={jobType} onValueChange={setJobType}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {JOB_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salaryRange">Salary Range</Label>
                    <Input id="salaryRange" name="salaryRange" defaultValue={editing?.salaryRange ?? ""} placeholder="e.g. UGX 3M - 5M" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="applicationDeadline">Application Deadline</Label>
                    <DatePicker id="applicationDeadline" name="applicationDeadline" value={deadline} onChange={setDeadline} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="notificationEmail">Notification Email</Label>
                    <Input
                      id="notificationEmail"
                      name="notificationEmail"
                      type="email"
                      defaultValue={editing?.notificationEmail ?? ""}
                      placeholder="Override global APPLICATION_EMAIL for this job"
                    />
                    <p className="text-xs text-[var(--color-muted-fg)]">Leave blank to use the global APPLICATION_EMAIL env var.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea id="description" name="description" required rows={5} defaultValue={editing?.description ?? ""} />
                </div>
                {editing && (
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="isActive" defaultChecked={editing.isActive} className="h-4 w-4 rounded border-[var(--color-border)]" />
                    Active (visible on public site)
                  </label>
                )}
              </div>
            )}

            {/* ── Tab: Details & Lists ── */}
            {activeTab === "details" && (
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { name: "requirements", label: "Requirements" },
                  { name: "responsibilities", label: "Responsibilities" },
                  { name: "qualifications", label: "Qualifications" },
                  { name: "benefits", label: "Benefits" },
                ].map(({ name, label }) => (
                  <div key={name} className="space-y-2">
                    <Label htmlFor={name}>{label} (one per line)</Label>
                    <Textarea
                      id={name}
                      name={name}
                      rows={5}
                      defaultValue={
                        editing
                          ? ((editing[name as keyof Career] as string[]) ?? []).join("\n")
                          : ""
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            {/* ── Tab: Custom Fields ── */}
            {activeTab === "custom" && (
              <CustomFieldsBuilder fields={customFields} onChange={setCustomFields} />
            )}

            <div className="flex gap-2 border-t border-[var(--color-border)] pt-4">
              <Button type="submit" size="sm">{editing ? "Update" : "Create"}</Button>
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
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Applications</th>
                <th className="px-4 py-3">Fields</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {careers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-[var(--color-muted-fg)]">
                    <div className="flex flex-col items-center gap-2">
                      <Briefcase className="h-8 w-8" />
                      No positions yet. Add one to get started.
                    </div>
                  </td>
                </tr>
              ) : (
                careers.map((c) => (
                  <tr key={c.id} className="group hover:bg-[rgb(var(--token-muted)/0.50)]">
                    <td className="px-4 py-3 font-medium">{c.title}</td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">{c.department}</td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">{c.location}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-[var(--color-muted)] px-2.5 py-0.5 text-xs font-medium">
                        {formatTypeLabel(c.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {c.applicationDeadline ? new Date(c.applicationDeadline).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/careers/${c.id}/applications`} className="inline-flex items-center gap-1 text-[var(--color-primary)] hover:underline">
                        <Users className="h-3.5 w-3.5" /> {c._count.applications}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {c.customFields?.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Settings2 className="h-3.5 w-3.5" /> {c.customFields.length}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <form action={async (fd) => { await toggleCareerAction(fd); router.refresh(); }}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="isActive" value={String(c.isActive)} />
                        <button type="submit" className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${c.isActive ? "bg-[rgb(var(--token-success)/0.20)] text-[var(--color-success)]" : "bg-[var(--color-muted)] text-[var(--color-muted-fg)]"}`}>
                          {c.isActive ? "Active" : "Inactive"}
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
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
                              <ConfirmDialogTitle>Delete position</ConfirmDialogTitle>
                              <ConfirmDialogDescription>
                                Delete &quot;{c.title}&quot;? All applications will also be removed.
                              </ConfirmDialogDescription>
                            </ConfirmDialogHeader>
                            <ConfirmDialogFooter>
                              <ConfirmDialogCancel>Cancel</ConfirmDialogCancel>
                              <ConfirmDialogAction onClick={async () => {
                                const fd = new FormData();
                                fd.set("id", c.id);
                                await deleteCareerAction(fd);
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
