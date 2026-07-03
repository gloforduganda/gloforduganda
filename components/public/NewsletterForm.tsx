"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { subscribeAction } from "@/lib/actions/subscribers";
import { Button } from "@/components/ui/Button";

export function NewsletterForm({ source = "footer", dark = false }: { source?: string; dark?: boolean }) {
  const t = useTranslations("public.newsletter");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [pending, start] = useTransition();
  const [state, setState] = useState<"idle" | "sent" | "already" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      try {
        const result = await subscribeAction({ email, name: name || undefined, source });
        setState(result.alreadyActive ? "already" : "sent");
      } catch (err) {
        setState("error");
        setError(err instanceof Error ? err.message : t("../../common.error" as never));
      }
    });
  };

  const inputCls = dark
    ? "w-full rounded-[var(--radius-md)] border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
    : "w-full rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-muted-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]";

  if (state === "sent") {
    return (
      <p role="status" className={dark ? "text-sm text-white/70" : "text-sm text-[var(--color-muted-fg)]"}>
        {t("successMessage", { email })}
      </p>
    );
  }
  if (state === "already") {
    return (
      <p role="status" className={dark ? "text-sm text-white/70" : "text-sm text-[var(--color-muted-fg)]"}>
        {t("alreadySubscribed")}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="block">
        <span className="sr-only">{t("nameLabel")}</span>
        <input
          type="text"
          placeholder={t("namePlaceholder")}
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
        />
      </label>
      <label className="block">
        <span className="sr-only">{t("emailLabel")}</span>
        <input
          type="email"
          required
          placeholder={t("emailPlaceholder")}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />
      </label>
      <Button type="submit" disabled={pending} size="sm" className="w-full">
        {pending ? t("subscribing") : t("subscribe")}
      </Button>
      {error ? (
        <p role="alert" className={dark ? "text-xs text-red-300" : "text-xs text-[var(--color-danger)]"}>
          {error}
        </p>
      ) : null}
    </form>
  );
}
