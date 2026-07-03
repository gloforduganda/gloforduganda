"use client";

import { useState, useTransition } from "react";
import {
  createCampaignAction,
  updateCampaignAction,
  deleteCampaignAction,
} from "@/lib/actions/campaigns";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { DatePicker } from "@/components/ui/DatePicker";
import { useConfirmAction } from "@/components/ui/useConfirmAction";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/Select";

type ProgramOption = { id: string; title: string };

type Initial = {
  id?: string;
  slug?: string;
  title?: string;
  description?: string;
  goalCents?: number;
  currency?: string;
  startsAt?: string;
  endsAt?: string;
  programId?: string;
  isActive?: boolean;
};

const CURRENCIES = ["USD", "UGX", "KES", "TZS", "EUR", "GBP"];

export function CampaignForm({ initial, programs = [] }: { initial?: Initial; programs?: ProgramOption[] }) {
  const isEdit = !!initial?.id;
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [goal, setGoal] = useState<string>(
    initial?.goalCents ? String(initial.goalCents / 100) : "",
  );
  const [currency, setCurrency] = useState(initial?.currency ?? "USD");
  // DatePicker uses YYYY-MM-DD; datetime-local was YYYY-MM-DDTHH:mm — extract date part
  const [startsAt, setStartsAt] = useState(initial?.startsAt ? initial.startsAt.slice(0, 10) : "");
  const [endsAt, setEndsAt] = useState(initial?.endsAt ? initial.endsAt.slice(0, 10) : "");
  const [programId, setProgramId] = useState(initial?.programId ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
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
          description,
          goalCents: goal ? Math.round(Number(goal) * 100) : null,
          currency,
          startsAt: startsAt ? new Date(startsAt).toISOString() : null,
          endsAt: endsAt ? new Date(endsAt).toISOString() : null,
          programId: programId || null,
          isActive,
        };
        if (isEdit) await updateCampaignAction({ id: initial!.id!, ...payload });
        else await createCampaignAction(payload);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    });
  };

  const del = async () => {
    if (!initial?.id) return;
    const ok = await confirmAction({
      title: "Delete campaign",
      description: "Delete this campaign? Donations remain but are unlinked.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    start(async () => {
      try {
        await deleteCampaignAction({ id: initial.id });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete");
      }
    });
  };

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[1fr_280px]">
      <section className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Climate Resilience Drive 2026" />
        </Field>
        <Field label="Slug">
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. climate-resilience-2026" />
        </Field>
        <Field label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="Describe the campaign goal and how donations will be used..." />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Goal amount">
            <Input type="number" min={0} step="0.01" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="0.00" />
          </Field>
          <Field label="Currency">
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Starts on">
            <DatePicker value={startsAt} onChange={setStartsAt} placeholder="Pick start date" />
          </Field>
          <Field label="Ends on">
            <DatePicker value={endsAt} onChange={setEndsAt} placeholder="Pick end date" />
          </Field>
        </div>
        <Field label="Linked program (optional)">
          <Select value={programId || "__none__"} onValueChange={(v) => setProgramId(v === "__none__" ? "" : v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="— No program —" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— No program —</SelectItem>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {/* Styled checkbox */}
        <label className="flex cursor-pointer items-center gap-3">
          <button
            type="button"
            role="checkbox"
            aria-checked={isActive}
            onClick={() => setIsActive(!isActive)}
            className={`relative h-5 w-5 shrink-0 rounded-[var(--radius-sm)] border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] ${
              isActive
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                : "border-[var(--color-input)] bg-[var(--color-bg)]"
            }`}
          >
            {isActive && (
              <svg className="absolute inset-0 m-auto h-3 w-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
              </svg>
            )}
          </button>
          <span className="text-sm font-medium">Campaign is active</span>
        </label>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 space-y-3">
          {error ? (
            <p role="alert" className="rounded-[var(--radius-sm)] bg-[rgb(var(--token-danger)/0.10)] p-2 text-sm text-[var(--color-danger)]">
              {error}
            </p>
          ) : null}
          <Button onClick={submit} disabled={pending} className="w-full">
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create campaign"}
          </Button>
          {isEdit ? (
            <Button variant="outline" onClick={del} disabled={pending} className="w-full">
              Delete campaign
            </Button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
