import { requireActorFromSession } from "@/lib/auth-context";
import { db } from "@/lib/db";
import { ThemeEditor } from "./ThemeEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Theme", robots: { index: false, follow: false } };

export default async function ThemePage() {
  await requireActorFromSession();

  const [theme, presets] = await Promise.all([
    db.theme.findUnique({ where: { id: "singleton" } }),
    db.themePreset.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[24px] font-bold tracking-[-0.025em] text-[var(--color-fg)]">
          Theme
        </h1>
        <p className="mt-1 text-[13px] text-[var(--color-muted-fg)]">
          Customize your site&apos;s appearance. Pick a preset or fine-tune individual design tokens.
          Changes preview instantly and apply globally when saved.
        </p>
      </header>

      <ThemeEditor
        initial={{
          colors: (theme?.colors as Record<string, string>) ?? {},
          typography: (theme?.typography as Record<string, string>) ?? {},
          radius: (theme?.radius as Record<string, string>) ?? {},
          shadows: (theme?.shadows as Record<string, string>) ?? {},
        }}
        presets={presets.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          colors: p.colors as Record<string, string>,
          typography: p.typography as Record<string, string>,
          radius: p.radius as Record<string, string>,
          shadows: p.shadows as Record<string, string>,
          builtIn: p.builtIn,
        }))}
        activePresetId={theme?.presetId ?? null}
      />
    </div>
  );
}
