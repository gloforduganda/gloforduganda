"use client";

import { useState, useTransition } from "react";
import { RotateCcw, X } from "lucide-react";
import { refundDonationAction } from "@/lib/actions/donations";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useConfirmAction } from "@/components/ui/useConfirmAction";

export function RefundButton({ id, amountLabel, amountCents }: { id: string; amountLabel: string; amountCents: number }) {
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [partial, setPartial] = useState("");
  const confirmAction = useConfirmAction();

  const submit = async () => {
    const partialCents = partial ? Math.round(Number(partial) * 100) : undefined;
    if (partialCents !== undefined && (partialCents < 1 || partialCents > amountCents)) {
      setErr(`Amount must be between 0.01 and ${amountLabel}`);
      return;
    }
    const ok = await confirmAction({
      title: `Refund ${partial ? `$${partial}` : amountLabel}`,
      description: `This will issue a refund to the donor${reason ? ` with reason: "${reason}"` : ""}. This cannot be undone.`,
      confirmLabel: "Issue Refund",
      variant: "danger",
    });
    if (!ok) return;
    setErr(null);
    start(async () => {
      try {
        await refundDonationAction({ id, reason: reason || undefined, amountCents: partialCents });
        setOpen(false);
        setReason("");
        setPartial("");
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Refund failed");
      }
    });
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} disabled={pending}>
        <RotateCcw className="h-3.5 w-3.5" /> Refund
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="refund-dialog-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 id="refund-dialog-title" className="text-lg font-semibold">Refund {amountLabel}</h2>
              <button
                type="button"
                onClick={() => { setOpen(false); setErr(null); }}
                className="rounded-lg p-1 hover:bg-[var(--color-muted)] text-[var(--color-muted-fg)]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="refund-partial" className="text-sm font-medium">Partial amount (optional)</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--color-muted-fg)]">$</span>
                <Input
                  id="refund-partial"
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={amountCents / 100}
                  value={partial}
                  onChange={(e) => setPartial(e.target.value)}
                  placeholder={`Leave blank for full ${amountLabel}`}
                />
              </div>
              <p className="text-xs text-[var(--color-muted-fg)]">Leave blank to refund the full amount.</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="refund-reason" className="text-sm font-medium">Reason (optional)</label>
              <Textarea
                id="refund-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Reason for refund (logged with the transaction)"
              />
            </div>

            {err && (
              <p role="alert" className="rounded-lg bg-[rgb(var(--token-danger)/0.10)] px-3 py-2 text-sm text-[var(--color-danger)]">
                {err}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => { setOpen(false); setErr(null); }}
                disabled={pending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={submit}
                disabled={pending}
                className="flex-1 bg-[var(--color-danger)] text-white hover:bg-[rgb(var(--token-danger)/0.90)]"
              >
                {pending ? "Processing…" : "Issue Refund"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
