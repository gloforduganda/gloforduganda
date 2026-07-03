import { db } from "@/lib/db";

/**
 * Returns the flat token map injected onto <html>. Keys (without
 * the `--token-` prefix) must match the names in app/globals.css.
 *
 * Color values are space-separated RGB triplets (R G B) so they
 * can be used with alpha: rgb(var(--token-primary) / 0.5).
 */
export type ThemeTokens = Record<string, string>;

const DEFAULTS: ThemeTokens = {
  "bg": "250 247 255",
  "surface-2": "238 230 252",
  "fg": "20 10 35",
  "muted": "242 236 252",
  "muted-fg": "110 90 140",
  "card": "255 255 255",
  "card-fg": "20 10 35",
  "hairline": "123 45 187",
  "input": "235 225 248",
  "ring": "123 45 187",
  "primary": "123 45 187",
  "primary-fg": "255 255 255",
  "secondary": "235 225 248",
  "secondary-fg": "20 10 35",
  "accent": "155 80 220",
  "accent-fg": "255 255 255",
  "danger": "239 68 68",
  "danger-fg": "255 255 255",
  "success": "34 197 94",
  "success-fg": "255 255 255",
  "font-sans": '"Inter", ui-sans-serif, system-ui, sans-serif',
  "font-serif": '"Playfair Display", ui-serif, Georgia, serif',
  "radius-sm": "0.25rem",
  "radius-md": "0.5rem",
  "radius-lg": "0.75rem",
};

async function fetchThemeTokens(): Promise<ThemeTokens> {
  try {
    const t = await db.theme.findUnique({ where: { id: "singleton" } });
    if (!t) return DEFAULTS;
    const merged: ThemeTokens = { ...DEFAULTS };
    const assign = (obj: unknown, prefix = "") => {
      if (!obj || typeof obj !== "object") return;
      for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
        if (typeof v === "string") merged[`${prefix}${k}`] = v;
      }
    };
    assign(t.colors);
    assign(t.typography, "font-");
    assign(t.radius, "radius-");
    assign(t.shadows, "shadow-");
    return merged;
  } catch {
    return DEFAULTS;
  }
}

/**
 * Reads theme tokens directly from DB on every call — no cache.
 * The root layout calls this once per request; the cost is one
 * indexed PK lookup (~1ms). Removing the cache eliminates the
 * stale-theme-after-save problem entirely.
 */
export async function getActiveThemeTokens(): Promise<ThemeTokens> {
  return fetchThemeTokens();
}
