"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";
import { updateApplicationStatusAction } from "../../actions";

const STATUS_OPTIONS = [
  "SUBMITTED", "REVIEWING", "SHORTLISTED", "INTERVIEW", "OFFERED", "REJECTED", "WITHDRAWN",
] as const;

const STATUS_STYLES: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-700",
  REVIEWING: "bg-amber-100 text-amber-700",
  SHORTLISTED: "bg-purple-100 text-purple-700",
  INTERVIEW: "bg-indigo-100 text-indigo-700",
  OFFERED: "bg-[rgb(var(--token-success)/0.20)] text-[var(--color-success)]",
  REJECTED: "bg-[rgb(var(--token-danger)/0.20)] text-[var(--color-danger)]",
  WITHDRAWN: "bg-[var(--color-muted)] text-[var(--color-muted-fg)]",
};

type Application = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  nationality: string | null;
  address: string | null;
  resumeUrl: string | null;
  coverLetterUrl: string | null;
  idDocumentUrl: string | null;
  photoUrl: string | null;
  portfolioUrl: string | null;
  linkedinUrl: string | null;
  education: unknown;
  experience: unknown;
  customAnswers: unknown;
  status: string;
  notes: string | null;
  createdAt: Date | string;
};

type CustomField = { id: string; label: string; type: string; required: boolean };

function DocLink({ label, url }: { label: string; url: string | null }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-1.5 text-xs font-medium text-[var(--color-fg)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
    >
      <FileText className="h-3.5 w-3.5" />
      {label}
      <ExternalLink className="h-3 w-3 opacity-60" />
    </a>
  );
}

export function ApplicationsClient({
  career,
  applications,
  customFields = [],
}: {
  career: { id: string; title: string };
  applications: Application[];
  customFields?: CustomField[];
}) {
  const [viewingId, setViewingId] = useState<string | null>(null);
  const router = useRouter();

  const viewing = applications.find((a) => a.id === viewingId);

  async function handleStatusChange(formData: FormData) {
    await updateApplicationStatusAction(formData);
    router.refresh();
  }

  const education = viewing?.education as Array<Record<string, string>> | null;
  const experience = viewing?.experience as Array<Record<string, string>> | null;
  const customAnswers = viewing?.customAnswers as Record<string, string> | null;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <Link href="/admin/careers" className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]">
          <ArrowLeft className="h-4 w-4" /> Back to Careers
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Applications for &quot;{career.title}&quot;
        </h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          {applications.length} application{applications.length !== 1 ? "s" : ""} received.
        </p>
      </header>

      {/* Detail panel */}
      {viewing && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{viewing.firstName} {viewing.lastName}</h2>
            <Button variant="ghost" size="sm" onClick={() => setViewingId(null)}>Close</Button>
          </div>

          {/* Personal info */}
          <div className="mb-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Email", value: viewing.email },
              { label: "Phone", value: viewing.phone },
              { label: "Nationality", value: viewing.nationality },
              { label: "Address", value: viewing.address },
              { label: "LinkedIn", value: viewing.linkedinUrl, isLink: true },
            ].map(({ label, value, isLink }) =>
              value ? (
                <div key={label}>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">{label}</dt>
                  <dd className="mt-0.5">
                    {isLink ? (
                      <a href={value} target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">{value}</a>
                    ) : value}
                  </dd>
                </div>
              ) : null
            )}
          </div>

          {/* Documents */}
          <div className="mb-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">Documents</p>
            <div className="flex flex-wrap gap-2">
              <DocLink label="CV / Resume" url={viewing.resumeUrl} />
              <DocLink label="Cover Letter" url={viewing.coverLetterUrl} />
              <DocLink label="ID Document" url={viewing.idDocumentUrl} />
              <DocLink label="Photo" url={viewing.photoUrl} />
              <DocLink label="Portfolio" url={viewing.portfolioUrl} />
            </div>
            {!viewing.resumeUrl && !viewing.coverLetterUrl && !viewing.idDocumentUrl && !viewing.photoUrl && !viewing.portfolioUrl && (
              <p className="text-xs text-[var(--color-muted-fg)]">No documents uploaded.</p>
            )}
          </div>

          {/* Education */}
          {education && education.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">Education</p>
              <div className="space-y-2">
                {education.map((ed, i) => (
                  <div key={i} className="rounded-lg bg-[rgb(var(--token-muted)/0.40)] px-3 py-2 text-sm">
                    <span className="font-medium">{ed.institution}</span>
                    {ed.degree && <span className="text-[var(--color-muted-fg)]"> — {ed.degree}{ed.field ? `, ${ed.field}` : ""}</span>}
                    {ed.year && <span className="ml-2 text-xs text-[var(--color-muted-fg)]">({ed.year})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {experience && experience.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">Work Experience</p>
              <div className="space-y-2">
                {experience.map((ex, i) => (
                  <div key={i} className="rounded-lg bg-[rgb(var(--token-muted)/0.40)] px-3 py-2 text-sm">
                    <span className="font-medium">{ex.company}</span>
                    {ex.role && <span className="text-[var(--color-muted-fg)]"> — {ex.role}</span>}
                    {ex.duration && <span className="ml-2 text-xs text-[var(--color-muted-fg)]">({ex.duration})</span>}
                    {ex.description && <p className="mt-1 text-xs text-[var(--color-muted-fg)]">{ex.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom answers */}
          {customFields.length > 0 && customAnswers && Object.keys(customAnswers).length > 0 && (
            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">Additional Answers</p>
              <div className="space-y-2">
                {customFields.map((field) => {
                  const answer = customAnswers[field.id];
                  if (!answer) return null;
                  return (
                    <div key={field.id} className="rounded-lg bg-[rgb(var(--token-muted)/0.40)] px-3 py-2 text-sm">
                      <dt className="font-medium text-[var(--color-fg)]">{field.label}</dt>
                      <dd className="mt-0.5 text-[var(--color-muted-fg)]">{answer}</dd>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewing.notes && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">Internal Notes</p>
              <p className="whitespace-pre-wrap text-sm">{viewing.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[rgb(var(--token-muted)/0.50)] text-left text-xs uppercase tracking-wider text-[var(--color-muted-fg)]">
              <tr>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Applied</th>
                <th className="px-4 py-3">Docs</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[var(--color-muted-fg)]">
                    No applications received yet.
                  </td>
                </tr>
              ) : (
                applications.map((app) => {
                  const docCount = [app.resumeUrl, app.coverLetterUrl, app.idDocumentUrl, app.photoUrl, app.portfolioUrl].filter(Boolean).length;
                  return (
                    <tr key={app.id} className="group hover:bg-[rgb(var(--token-muted)/0.50)]">
                      <td className="px-4 py-3 font-medium">{app.firstName} {app.lastName}</td>
                      <td className="px-4 py-3 text-[var(--color-muted-fg)]">{app.email}</td>
                      <td className="px-4 py-3 text-[var(--color-muted-fg)]">{new Date(app.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {docCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)]">
                            <FileText className="h-3.5 w-3.5" /> {docCount}
                          </span>
                        ) : <span className="text-xs text-[var(--color-muted-fg)]">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <StatusSelect appId={app.id} defaultStatus={app.status} onSubmit={handleStatusChange} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => setViewingId(app.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
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

function StatusSelect({ appId, defaultStatus, onSubmit }: { appId: string; defaultStatus: string; onSubmit: (fd: FormData) => void }) {
  const [status, setStatus] = useState(defaultStatus);
  const formRef = React.useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={onSubmit} className="inline-flex">
      <input type="hidden" name="id" value={appId} />
      <input type="hidden" name="status" value={status} />
      <Select value={status} onValueChange={(v) => { setStatus(v); setTimeout(() => formRef.current?.requestSubmit(), 0); }}>
        <SelectTrigger className={`rounded-full py-0.5 pl-2.5 pr-7 text-xs font-medium ${STATUS_STYLES[status] ?? "bg-[var(--color-muted)] text-[var(--color-muted-fg)]"}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </form>
  );
}
