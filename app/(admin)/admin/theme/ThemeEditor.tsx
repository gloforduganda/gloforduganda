"use client";

import { useState, useCallback, useRef } from "react";
import { Save, Check, Palette, Undo2, Plus, X, Paintbrush, Type, Circle, Layers, Code } from "lucide-react";
import { updateThemeAction } from "@/lib/actions/theme";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

type TokenMap = Record<string, string>;
type ThemeData = {
  colors: TokenMap;
  typography: TokenMap;
  radius: TokenMap;
  shadows: TokenMap;
};

type Preset = {
  id: string;
  name: string;
  slug: string;
  colors: TokenMap;
  typography: TokenMap;
  radius: TokenMap;
  shadows: TokenMap;
  builtIn: boolean;
};

type GroupKey = keyof ThemeData;

const GROUP_META: Record<GroupKey, { label: string; icon: React.ElementType }> = {
  colors: { label: "Colors", icon: Paintbrush },
  typography: { label: "Typography", icon: Type },
  radius: { label: "Border Radius", icon: Circle },
  shadows: { label: "Shadows", icon: Layers },
};

/* ── RGB ↔ Hex conversion ── */
function rgbTripletToHex(triplet: string): string {
  const parts = triplet.trim().split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return "#000000";
  return (
    "#" +
    parts
      .map((n) =>
        Math.max(0, Math.min(255, n))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

function hexToRgbTriplet(hex: string): string {
  const h = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return "0 0 0";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

const CSS_TOKEN_KEY = /^[a-z][a-z0-9-]*$/;

const managedProps = new Set<string>();

function applyTokensToDOM(data: ThemeData) {
  const html = document.documentElement;
  const props: Array<[string, string]> = [];

  for (const [k, v] of Object.entries(data.colors))
    props.push([`--token-${k}`, v]);
  for (const [k, v] of Object.entries(data.typography))
    props.push([`--token-font-${k}`, v]);
  for (const [k, v] of Object.entries(data.radius))
    props.push([`--token-radius-${k}`, v]);
  for (const [k, v] of Object.entries(data.shadows))
    props.push([`--token-shadow-${k}`, v]);

  const nextKeys = new Set(props.map(([k]) => k));
  for (const old of managedProps) {
    if (!nextKeys.has(old)) {
      html.style.removeProperty(old);
      managedProps.delete(old);
    }
  }

  for (const [k, v] of props) {
    const safe = v.replace(/[{}<>]/g, "");
    html.style.setProperty(k, safe);
    managedProps.add(k);
  }
}

export function ThemeEditor({
  initial,
  presets,
  activePresetId,
}: {
  initial: ThemeData;
  presets: Preset[];
  activePresetId: string | null;
}) {
  const [groups, setGroups] = useState<ThemeData>(initial);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(activePresetId);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedGroups, setSavedGroups] = useState<ThemeData>(initial);
  const [activeTab, setActiveTab] = useState<GroupKey>("colors");
  const [addingToken, setAddingToken] = useState<GroupKey | null>(null);
  const [newTokenKey, setNewTokenKey] = useState("");
  const newTokenInputRef = useRef<HTMLInputElement>(null);

  const markDirty = useCallback(() => {
    setDirty(true);
    setSaved(false);
  }, []);

  const selectPreset = useCallback(
    (preset: Preset) => {
      const data: ThemeData = {
        colors: { ...preset.colors },
        typography: { ...preset.typography },
        radius: { ...preset.radius },
        shadows: { ...preset.shadows },
      };
      setGroups(data);
      setSelectedPresetId(preset.id);
      markDirty();
      applyTokensToDOM(data);
    },
    [markDirty],
  );

  const updateColor = (key: string, hex: string) => {
    const triplet = hexToRgbTriplet(hex);
    setGroups((s) => {
      const next = { ...s, colors: { ...s.colors, [key]: triplet } };
      applyTokensToDOM(next);
      return next;
    });
    setSelectedPresetId(null);
    markDirty();
  };

  const updateToken = (group: GroupKey, key: string, value: string) => {
    setGroups((s) => {
      const next = { ...s, [group]: { ...s[group], [key]: value } };
      applyTokensToDOM(next);
      return next;
    });
    setSelectedPresetId(null);
    markDirty();
  };

  const startAddToken = (group: GroupKey) => {
    setAddingToken(group);
    setNewTokenKey("");
    setTimeout(() => newTokenInputRef.current?.focus(), 50);
  };

  const commitAddToken = () => {
    const key = newTokenKey.trim().toLowerCase();
    if (key && CSS_TOKEN_KEY.test(key) && addingToken && !groups[addingToken][key]) {
      updateToken(addingToken, key, addingToken === "colors" ? "128 128 128" : "0.5rem");
    }
    setAddingToken(null);
    setNewTokenKey("");
  };

  const removeToken = (group: GroupKey, key: string) => {
    setGroups((s) => {
      const next = { ...s[group] };
      delete next[key];
      const updated = { ...s, [group]: next };
      applyTokensToDOM(updated);
      return updated;
    });
    setSelectedPresetId(null);
    markDirty();
  };

  const revert = () => {
    setGroups(savedGroups);
    setSelectedPresetId(activePresetId);
    setDirty(false);
    setSaved(false);
    setError(null);
    applyTokensToDOM(savedGroups);
  };

  const save = async () => {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await updateThemeAction({ ...groups, presetId: selectedPresetId });
      setSaved(true);
      setDirty(false);
      setSavedGroups(groups);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const pasteJson = () => {
    try {
      const parsed = JSON.parse(pasteText) as Partial<ThemeData>;
      setGroups((s) => {
        const next = {
          colors: { ...s.colors, ...(parsed.colors ?? {}) },
          typography: { ...s.typography, ...(parsed.typography ?? {}) },
          radius: { ...s.radius, ...(parsed.radius ?? {}) },
          shadows: { ...s.shadows, ...(parsed.shadows ?? {}) },
        };
        applyTokensToDOM(next);
        return next;
      });
      setSelectedPresetId(null);
      setPasteOpen(false);
      setPasteText("");
      markDirty();
    } catch {
      setError("That isn't valid JSON.");
    }
  };

  const colorEntries = Object.entries(groups.colors);

  return (
    <div className="space-y-6">
      {/* ── Save bar (sticky) ── */}
      {(dirty || saved || error) && (
        <div className="sticky top-[57px] z-20 -mx-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-3 shadow-lg shadow-black/[0.04]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              {error && (
                <p className="text-[13px] font-medium text-[var(--color-danger)]">{error}</p>
              )}
              {saved && (
                <p className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-success)]">
                  <Check className="h-3.5 w-3.5" /> Theme saved and applied globally.
                </p>
              )}
              {dirty && !error && !saved && (
                <p className="text-[13px] text-[var(--color-muted-fg)]">
                  You have unsaved changes previewing live.
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              {dirty && (
                <Button variant="outline" size="sm" onClick={revert}>
                  <Undo2 className="h-3.5 w-3.5" /> Revert
                </Button>
              )}
              <Button size="sm" onClick={save} disabled={saving || !dirty}>
                <Save className="h-3.5 w-3.5" /> {saving ? "Saving\u2026" : "Save theme"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Preset grid ── */}
      <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-5 py-3.5">
          <Palette className="h-4 w-4 text-[var(--color-primary)]" />
          <h2 className="text-[13px] font-semibold text-[var(--color-fg)]">Theme Presets</h2>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {presets.map((preset) => {
            const isActive = selectedPresetId === preset.id;
            const primary = preset.colors.primary ?? "30 80 160";
            const accent = preset.colors.accent ?? "14 130 200";
            const bg = preset.colors.bg ?? "255 255 255";
            const surface = preset.colors["surface-2"] ?? "240 240 240";
            return (
              <button
                key={preset.id}
                onClick={() => selectPreset(preset)}
                className={`group relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                  isActive
                    ? "border-[rgb(var(--token-primary))] shadow-md shadow-[rgb(var(--token-primary)/0.12)]"
                    : "border-[var(--color-border)] hover:border-[var(--color-muted-fg)] hover:shadow-sm"
                }`}
              >
                {isActive && (
                  <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[rgb(var(--token-primary))] shadow-sm">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                )}
                {/* Color preview strip */}
                <div className="mb-3 flex h-8 overflow-hidden rounded-lg">
                  <div className="flex-1" style={{ backgroundColor: `rgb(${primary.split(" ").join(",")})` }} />
                  <div className="flex-1" style={{ backgroundColor: `rgb(${accent.split(" ").join(",")})` }} />
                  <div className="flex-1 border-l border-black/5" style={{ backgroundColor: `rgb(${bg.split(" ").join(",")})` }} />
                  <div className="flex-1 border-l border-black/5" style={{ backgroundColor: `rgb(${surface.split(" ").join(",")})` }} />
                </div>
                <span className="text-[13px] font-medium text-[var(--color-fg)]">{preset.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Token editor with tabs ── */}
      <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
        {/* Tabs */}
        <div className="flex border-b border-[var(--color-border)]">
          {(["colors", "typography", "radius", "shadows"] as GroupKey[]).map((key) => {
            const meta = GROUP_META[key];
            const Icon = meta.icon;
            const count = Object.keys(groups[key]).length;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-[13px] font-medium transition-colors ${
                  activeTab === key
                    ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                    : "border-transparent text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {meta.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  activeTab === key
                    ? "bg-[rgb(var(--token-primary)/0.10)] text-[var(--color-primary)]"
                    : "bg-[var(--color-muted)] text-[var(--color-muted-fg)]"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="p-5">
          {activeTab === "colors" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-[var(--color-muted-fg)]">
                  Click swatches to pick colors. Values are stored as RGB triplets.
                </p>
                {addingToken === "colors" ? (
                  <div className="flex items-center gap-2">
                    <input
                      ref={newTokenInputRef}
                      value={newTokenKey}
                      onChange={(e) => setNewTokenKey(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") commitAddToken(); if (e.key === "Escape") { setAddingToken(null); setNewTokenKey(""); } }}
                      placeholder="token-name"
                      className="w-32 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-[13px] focus:border-[var(--color-primary)] focus:outline-none"
                    />
                    <Button size="sm" onClick={commitAddToken} disabled={!newTokenKey.trim()}><Check className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="outline" onClick={() => { setAddingToken(null); setNewTokenKey(""); }}><X className="h-3.5 w-3.5" /></Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => startAddToken("colors")}>
                    <Plus className="h-3.5 w-3.5" /> Add color
                  </Button>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {colorEntries.map(([k, v]) => (
                  <div
                    key={k}
                    className="group flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-2.5 transition-colors hover:border-[rgb(var(--token-primary)/0.2)]"
                  >
                    <label
                      aria-label={`Pick color for ${k}`}
                      className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-lg shadow-sm ring-1 ring-black/10"
                    >
                      <input
                        type="color"
                        value={rgbTripletToHex(v)}
                        onChange={(e) => updateColor(k, e.target.value)}
                        className="absolute inset-0 h-full w-full cursor-pointer border-0 p-0 opacity-0"
                      />
                      <span
                        className="block h-full w-full"
                        style={{ backgroundColor: v ? `rgb(${v.split(" ").join(",")})` : "#808080" }}
                      />
                    </label>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="text-[13px] font-medium text-[var(--color-fg)]">{k}</span>
                      <span className="font-mono text-[11px] text-[var(--color-muted-fg)]">
                        {rgbTripletToHex(v)}
                      </span>
                    </div>
                    <button
                      onClick={() => removeToken("colors", k)}
                      className="rounded-md p-1 text-[var(--color-muted-fg)] opacity-0 transition-all hover:bg-[rgb(var(--token-danger)/0.08)] hover:text-[var(--color-danger)] group-hover:opacity-100"
                      title="Remove"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-[var(--color-muted-fg)]">
                  Edit {GROUP_META[activeTab].label.toLowerCase()} tokens used across the site.
                </p>
                {addingToken === activeTab ? (
                  <div className="flex items-center gap-2">
                    <input
                      ref={newTokenInputRef}
                      value={newTokenKey}
                      onChange={(e) => setNewTokenKey(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") commitAddToken(); if (e.key === "Escape") { setAddingToken(null); setNewTokenKey(""); } }}
                      placeholder="token-name"
                      className="w-32 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-[13px] focus:border-[var(--color-primary)] focus:outline-none"
                    />
                    <Button size="sm" onClick={commitAddToken} disabled={!newTokenKey.trim()}><Check className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="outline" onClick={() => { setAddingToken(null); setNewTokenKey(""); }}><X className="h-3.5 w-3.5" /></Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => startAddToken(activeTab)}>
                    <Plus className="h-3.5 w-3.5" /> Add token
                  </Button>
                )}
              </div>
              {Object.entries(groups[activeTab]).length === 0 ? (
                <div className="rounded-lg bg-[var(--color-muted)] px-4 py-8 text-center">
                  <p className="text-[13px] text-[var(--color-muted-fg)]">No {GROUP_META[activeTab].label.toLowerCase()} tokens yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(groups[activeTab]).map(([k, v]) => (
                    <div key={k} className="group flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-2.5">
                      <code className="min-w-[8rem] shrink-0 rounded-md bg-[var(--color-muted)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--color-fg)]">
                        {k}
                      </code>
                      <input
                        aria-label={`${activeTab}.${k} value`}
                        value={v}
                        onChange={(e) => updateToken(activeTab, k, e.target.value)}
                        className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 font-mono text-[13px] text-[var(--color-fg)] transition-colors focus:border-[var(--color-primary)] focus:outline-none"
                      />
                      <button
                        onClick={() => removeToken(activeTab, k)}
                        className="rounded-md p-1 text-[var(--color-muted-fg)] opacity-0 transition-all hover:bg-[rgb(var(--token-danger)/0.08)] hover:text-[var(--color-danger)] group-hover:opacity-100"
                        title="Remove"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Import JSON (collapsible) ── */}
      <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
        <button
          onClick={() => setPasteOpen((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-[var(--color-muted)]"
        >
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-[var(--color-muted-fg)]" />
            <span className="text-[13px] font-semibold text-[var(--color-fg)]">Import JSON</span>
          </div>
          <span className="text-[12px] text-[var(--color-muted-fg)]">
            {pasteOpen ? "Hide" : "Paste & merge tokens"}
          </span>
        </button>
        {pasteOpen && (
          <div className="space-y-3 border-t border-[var(--color-border)] p-5">
            <Textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={8}
              placeholder='{"colors": {"primary": "30 80 160"}, "radius": {"md": "0.5rem"}}'
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 font-mono text-[12px] text-[var(--color-fg)] transition-colors focus:border-[var(--color-primary)] focus:outline-none"
            />
            <Button size="sm" onClick={pasteJson} disabled={!pasteText.trim()}>
              Merge into tokens
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
