/**
 * Next.js loads this file once per runtime and calls `register()` before
 * any request is served. We use it for tenant-agnostic boot hooks:
 *
 *   1. A structured logger with correlation-ID support that downstream
 *      code imports from `@/lib/observability/log`.
 *   2. Sentry error capture — gated on SENTRY_DSN so unset = no-op.
 *   3. A hook point for OpenTelemetry — guarded so the app still boots
 *      when OTEL packages aren't installed.
 */

export async function onRequestError(
  err: unknown,
  request: unknown,
  context: unknown,
) {
  if (process.env.SENTRY_DSN) {
    try {
      const Sentry = await import("@sentry/nextjs");
      Sentry.captureRequestError(
        err as Parameters<typeof Sentry.captureRequestError>[0],
        request as Parameters<typeof Sentry.captureRequestError>[1],
        context as Parameters<typeof Sentry.captureRequestError>[2],
      );
    } catch {
      // Sentry not configured
    }
  }
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // ─── Structured stdout logger ──────────────────────────────
  const { subscribeProcessErrors } = await import("@/lib/observability/log");
  subscribeProcessErrors();

  // ─── Sentry (optional) ─────────────────────────────────────
  // Loaded dynamically so the dependency is only required when
  // SENTRY_DSN is set. If the package isn't installed, swallow the
  // import error and keep booting — logger still catches everything.
  if (process.env.SENTRY_DSN) {
    try {
      const { initSentry } = await import("@/lib/observability/sentry");
      initSentry();
    } catch {
      // @sentry/nextjs not installed — expected in environments without DSN configured
    }
  }

  // ─── OpenTelemetry (optional) ──────────────────────────────
  // if (process.env.OTEL_ENABLED === "1") {
  //   const { registerOTel } = await import("@vercel/otel");
  //   registerOTel({ serviceName: "gloford" });
  // }
}
