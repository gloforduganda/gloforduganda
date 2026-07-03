"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import {
  ArrowLeft, ArrowRight, Plus, Trash2, CheckCircle2, Loader2,
  Briefcase, MapPin, Building2, Upload, FileText, User, GraduationCap,
  Paperclip, ChevronRight,
} from "lucide-react";
import { submitApplicationAction } from "./actions";

type Education = { institution: string; degree: string; field: string; year: string };
type Experience = { company: string; role: string; duration: string; description: string };
type CustomField = { id: string; label: string; type: string; required: boolean; options?: string[] };

const EMPTY_EDUCATION: Education = { institution: "", degree: "", field: "", year: "" };
const EMPTY_EXPERIENCE: Experience = { company: "", role: "", duration: "", description: "" };

const inputCls =
  "w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm transition focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--token-primary)/0.20)]";
const labelCls = "block text-sm font-medium text-[var(--color-fg)] mb-1.5";

const STEPS = [
  { id: "personal", label: "Personal Info", icon: User },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "documents", label: "Documents", icon: Paperclip },
  { id: "custom", label: "Additional", icon: FileText },
];

function FileUploadField({
  name,
  label,
  required,
  accept = ".pdf,.doc,.docx",
  hint,
}: {
  name: string;
  label: string;
  required?: boolean;
  accept?: string;
  hint?: string;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label className={labelCls}>
        {label} {required && <span className="text-[var(--color-danger)]">*</span>}
      </label>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[rgb(var(--token-muted)/0.30)] px-4 py-4 transition hover:border-[var(--color-primary)] hover:bg-[rgb(var(--token-primary)/0.04)]"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white">
          <Upload className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          {fileName ? (
            <p className="truncate text-sm font-medium text-[var(--color-fg)]">{fileName}</p>
          ) : (
            <p className="text-sm text-[var(--color-muted-fg)]">
              Click to upload <span className="font-medium text-[var(--color-primary)]">or drag & drop</span>
            </p>
          )}
          {hint && <p className="mt-0.5 text-xs text-[var(--color-muted-fg)]">{hint}</p>}
        </div>
        {fileName && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setFileName(null); if (inputRef.current) inputRef.current.value = ""; }}
            className="shrink-0 text-[var(--color-muted-fg)] hover:text-[var(--color-danger)]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        required={required}
        className="sr-only"
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
      />
    </div>
  );
}

export function CareerApplyForm({
  slug,
  jobTitle,
  department,
  location,
  type,
  requirements,
  customFields = [],
}: {
  slug: string;
  jobTitle: string;
  department: string;
  location: string;
  type: string;
  requirements: string[];
  customFields?: CustomField[];
}) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [education, setEducation] = useState<Education[]>([{ ...EMPTY_EDUCATION }]);
  const [experience, setExperience] = useState<Experience[]>([{ ...EMPTY_EXPERIENCE }]);
  const formRef = useRef<HTMLFormElement>(null);

  const typeLabel = type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Filter steps: skip "custom" if no custom fields
  const visibleSteps = STEPS.filter((s) => s.id !== "custom" || customFields.length > 0);
  const totalSteps = visibleSteps.length;
  const currentStep = visibleSteps[step];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("slug", slug);
    fd.set("education", JSON.stringify(education.filter((ed) => ed.institution)));
    fd.set("experience", JSON.stringify(experience.filter((ex) => ex.company)));

    // Collect custom answers
    const customAnswers: Record<string, string> = {};
    for (const field of customFields) {
      const val = fd.get(`custom_${field.id}`);
      if (val) customAnswers[field.id] = val as string;
    }
    fd.set("customAnswers", JSON.stringify(customAnswers));

    startTransition(async () => {
      try {
        await submitApplicationAction(fd);
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit application. Please try again.");
      }
    });
  }

  if (success) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-4 py-20">
        <ScrollReveal>
          <div className="max-w-lg text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgb(var(--token-success)/0.10)]">
              <CheckCircle2 className="h-8 w-8 text-[var(--color-success)]" />
            </div>
            <h1 className="mt-6 font-display text-3xl font-bold text-[var(--color-fg)]">
              Application Submitted!
            </h1>
            <p className="mt-3 text-[var(--color-muted-fg)]">
              Thank you for applying to <strong>{jobTitle}</strong>. We will review your application and get back to you soon.
            </p>
            <Link
              href="/careers"
              className="mt-8 inline-flex items-center rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white transition hover:shadow-lg"
            >
              Back to Careers
            </Link>
          </div>
        </ScrollReveal>
      </section>
    );
  }

  return (
    <>
      {/* Job header */}
      <section className="bg-gradient-to-br from-[rgb(248_250_249)] to-[rgb(240_247_244)] py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Link
            href={`/careers/${slug}`}
            className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to job details
          </Link>
          <h1 className="font-display text-3xl font-bold text-[var(--color-fg)]">
            Apply for: {jobTitle}
          </h1>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--color-muted-fg)]">
            <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" /> {department}</span>
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {location}</span>
            <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {typeLabel}</span>
          </div>
        </div>
      </section>

      {/* Progress stepper */}
      <div className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="flex items-center overflow-x-auto py-4">
            {visibleSteps.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <div key={s.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => i < step && setStep(i)}
                    className={`flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      isActive
                        ? "bg-[var(--color-primary)] text-white"
                        : isDone
                        ? "cursor-pointer text-[var(--color-primary)] hover:bg-[rgb(var(--token-primary)/0.08)]"
                        : "text-[var(--color-muted-fg)]"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                    {s.label}
                  </button>
                  {i < totalSteps - 1 && (
                    <ChevronRight className="mx-1 h-3.5 w-3.5 shrink-0 text-[var(--color-muted-fg)]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form */}
      <section className="bg-[var(--color-bg)] py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <form ref={formRef} onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-8">
            {error && (
              <p role="alert" className="rounded-lg bg-[rgb(var(--token-danger)/0.10)] px-4 py-3 text-sm text-[var(--color-danger)]">
                {error}
              </p>
            )}

            {/* ── Step 0: Personal Info ── */}
            {currentStep?.id === "personal" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-[var(--color-fg)]">Personal Information</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className={labelCls}>First Name <span className="text-[var(--color-danger)]">*</span></label>
                    <input id="firstName" name="firstName" required className={inputCls} defaultValue={formRef.current ? (formRef.current.elements.namedItem("firstName") as HTMLInputElement)?.value : ""} />
                  </div>
                  <div>
                    <label htmlFor="lastName" className={labelCls}>Last Name <span className="text-[var(--color-danger)]">*</span></label>
                    <input id="lastName" name="lastName" required className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="email" className={labelCls}>Email <span className="text-[var(--color-danger)]">*</span></label>
                    <input id="email" name="email" type="email" required className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="phone" className={labelCls}>Phone</label>
                    <input id="phone" name="phone" type="tel" className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="nationality" className={labelCls}>Nationality</label>
                    <input id="nationality" name="nationality" className={inputCls} placeholder="e.g. Ugandan" />
                  </div>
                  <div>
                    <label htmlFor="linkedinUrl" className={labelCls}>LinkedIn Profile</label>
                    <input id="linkedinUrl" name="linkedinUrl" type="url" placeholder="https://linkedin.com/in/..." className={inputCls} />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="address" className={labelCls}>Address / Location</label>
                    <input id="address" name="address" className={inputCls} placeholder="City, Country" />
                  </div>
                </div>
                {requirements.length > 0 && (
                  <div className="rounded-xl border border-[var(--color-border)] bg-white p-4">
                    <p className="mb-2 text-sm font-semibold text-[var(--color-fg)]">Key Requirements</p>
                    <ul className="space-y-1 text-sm text-[var(--color-muted-fg)]">
                      {requirements.slice(0, 5).map((r, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 1: Education ── */}
            {currentStep?.id === "education" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[var(--color-fg)]">Education</h2>
                  <button
                    type="button"
                    onClick={() => setEducation((p) => [...p, { ...EMPTY_EDUCATION }])}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)]"
                  >
                    <Plus className="h-4 w-4" /> Add Entry
                  </button>
                </div>
                {education.map((ed, i) => (
                  <div key={i} className="rounded-xl border border-[var(--color-border)] bg-white p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--color-muted-fg)]">Entry {i + 1}</span>
                      {education.length > 1 && (
                        <button type="button" onClick={() => setEducation((p) => p.filter((_, j) => j !== i))} className="text-[var(--color-danger)]">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input placeholder="Institution *" value={ed.institution} onChange={(e) => { const a = [...education]; a[i] = { ...ed, institution: e.target.value }; setEducation(a); }} className={inputCls} />
                      <input placeholder="Degree" value={ed.degree} onChange={(e) => { const a = [...education]; a[i] = { ...ed, degree: e.target.value }; setEducation(a); }} className={inputCls} />
                      <input placeholder="Field of Study" value={ed.field} onChange={(e) => { const a = [...education]; a[i] = { ...ed, field: e.target.value }; setEducation(a); }} className={inputCls} />
                      <input placeholder="Graduation Year" value={ed.year} onChange={(e) => { const a = [...education]; a[i] = { ...ed, year: e.target.value }; setEducation(a); }} className={inputCls} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Step 2: Experience ── */}
            {currentStep?.id === "experience" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[var(--color-fg)]">Work Experience</h2>
                  <button
                    type="button"
                    onClick={() => setExperience((p) => [...p, { ...EMPTY_EXPERIENCE }])}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)]"
                  >
                    <Plus className="h-4 w-4" /> Add Entry
                  </button>
                </div>
                {experience.map((ex, i) => (
                  <div key={i} className="rounded-xl border border-[var(--color-border)] bg-white p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--color-muted-fg)]">Entry {i + 1}</span>
                      {experience.length > 1 && (
                        <button type="button" onClick={() => setExperience((p) => p.filter((_, j) => j !== i))} className="text-[var(--color-danger)]">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input placeholder="Company *" value={ex.company} onChange={(e) => { const a = [...experience]; a[i] = { ...ex, company: e.target.value }; setExperience(a); }} className={inputCls} />
                      <input placeholder="Role / Title" value={ex.role} onChange={(e) => { const a = [...experience]; a[i] = { ...ex, role: e.target.value }; setExperience(a); }} className={inputCls} />
                      <input placeholder="Duration (e.g. 2 years)" value={ex.duration} onChange={(e) => { const a = [...experience]; a[i] = { ...ex, duration: e.target.value }; setExperience(a); }} className={inputCls} />
                      <textarea placeholder="Description" rows={2} value={ex.description} onChange={(e) => { const a = [...experience]; a[i] = { ...ex, description: e.target.value }; setExperience(a); }} className={inputCls} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Step 3: Documents ── */}
            {currentStep?.id === "documents" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-[var(--color-fg)]">Documents</h2>
                <p className="text-sm text-[var(--color-muted-fg)]">
                  Upload your documents as PDF, Word, or image files (max 10 MB each).
                </p>
                <div className="grid gap-5 sm:grid-cols-2">
                  <FileUploadField name="resumeFile" label="CV / Resume" required hint="PDF or Word document" />
                  <FileUploadField name="coverLetterFile" label="Cover Letter" hint="PDF or Word document" />
                  <FileUploadField name="idDocumentFile" label="National ID / Passport" hint="PDF or image" accept=".pdf,.jpg,.jpeg,.png,.webp" />
                  <FileUploadField name="photoFile" label="Passport-Size Photo" hint="JPEG or PNG, clear face photo" accept=".jpg,.jpeg,.png,.webp" />
                  <FileUploadField name="portfolioFile" label="Portfolio / Work Samples" hint="PDF or document" />
                </div>
              </div>
            )}

            {/* ── Step 4: Custom Fields ── */}
            {currentStep?.id === "custom" && customFields.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-[var(--color-fg)]">Additional Information</h2>
                <div className="space-y-5">
                  {customFields.map((field) => (
                    <div key={field.id}>
                      <label htmlFor={`custom_${field.id}`} className={labelCls}>
                        {field.label}
                        {field.required && <span className="ml-1 text-[var(--color-danger)]">*</span>}
                      </label>
                      {field.type === "textarea" ? (
                        <textarea
                          id={`custom_${field.id}`}
                          name={`custom_${field.id}`}
                          required={field.required}
                          rows={4}
                          className={inputCls}
                        />
                      ) : field.type === "select" && field.options ? (
                        <select
                          id={`custom_${field.id}`}
                          name={`custom_${field.id}`}
                          required={field.required}
                          className={inputCls}
                        >
                          <option value="">Select an option…</option>
                          {field.options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === "file" ? (
                        <FileUploadField
                          name={`custom_${field.id}`}
                          label=""
                          required={field.required}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                        />
                      ) : (
                        <input
                          id={`custom_${field.id}`}
                          name={`custom_${field.id}`}
                          type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                          required={field.required}
                          className={inputCls}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-6">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-6 py-2.5 text-sm font-medium text-[var(--color-fg)] transition hover:bg-[var(--color-muted)]"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              ) : (
                <div />
              )}

              {step < totalSteps - 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-2.5 text-sm font-semibold text-white transition hover:shadow-lg"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-2.5 text-sm font-semibold text-white transition hover:shadow-lg disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isPending ? "Submitting…" : `Submit Application`}
                </button>
              )}
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
