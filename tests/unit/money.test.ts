import { describe, it, expect } from "vitest";
import { formatMoney, defaultPresets } from "@/lib/utils/money";

describe("formatMoney", () => {
  it("formats USD cents correctly", () => {
    expect(formatMoney(5000, "USD")).toBe("$50");
  });

  it("formats USD with cents when non-zero", () => {
    expect(formatMoney(5050, "USD")).toBe("$50.50");
  });

  it("formats zero", () => {
    expect(formatMoney(0, "USD")).toBe("$0");
  });

  it("formats UGX (no decimal)", () => {
    const result = formatMoney(100000, "UGX");
    expect(result).toContain("100");
  });

  it("formats large amounts with compact notation", () => {
    const result = formatMoney(1_000_000, "USD");
    expect(result).toContain("10,000");
  });

  it("handles EUR", () => {
    const result = formatMoney(2000, "EUR");
    expect(result).toContain("20");
  });
});

describe("defaultPresets", () => {
  it("returns 4 presets for USD", () => {
    expect(defaultPresets("USD")).toHaveLength(4);
  });

  it("returns 4 presets for UGX", () => {
    expect(defaultPresets("UGX")).toHaveLength(4);
  });

  it("all presets are positive integers", () => {
    for (const cents of defaultPresets("USD")) {
      expect(cents).toBeGreaterThan(0);
      expect(Number.isInteger(cents)).toBe(true);
    }
  });

  it("presets are in ascending order", () => {
    const presets = defaultPresets("USD");
    for (let i = 1; i < presets.length; i++) {
      expect(presets[i]).toBeGreaterThan(presets[i - 1]!);
    }
  });

  it("UGX presets are larger than USD presets (different scale)", () => {
    const ugx = defaultPresets("UGX");
    const usd = defaultPresets("USD");
    expect(ugx[0]).toBeGreaterThan(usd[0]!);
  });
});
