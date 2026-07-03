import { describe, it, expect } from "vitest";
import { campaignCreateSchema, campaignUpdateSchema, campaignDeleteSchema } from "@/lib/validators/campaigns";

describe("campaignCreateSchema", () => {
  const base = { slug: "summer-2026", title: "Summer Drive", description: "Annual campaign" };

  it("accepts minimal valid campaign", () => {
    expect(campaignCreateSchema.safeParse(base).success).toBe(true);
  });

  it("defaults currency to USD", () => {
    expect(campaignCreateSchema.parse(base).currency).toBe("USD");
  });

  it("defaults isActive to true", () => {
    expect(campaignCreateSchema.parse(base).isActive).toBe(true);
  });

  it("accepts goalCents as positive integer", () => {
    expect(campaignCreateSchema.safeParse({ ...base, goalCents: 500000 }).success).toBe(true);
  });

  it("rejects negative goalCents", () => {
    expect(campaignCreateSchema.safeParse({ ...base, goalCents: -1 }).success).toBe(false);
  });

  it("rejects currency not exactly 3 chars", () => {
    expect(campaignCreateSchema.safeParse({ ...base, currency: "US" }).success).toBe(false);
    expect(campaignCreateSchema.safeParse({ ...base, currency: "USDD" }).success).toBe(false);
  });

  it("accepts valid ISO date strings for startsAt/endsAt", () => {
    expect(
      campaignCreateSchema.safeParse({
        ...base,
        startsAt: "2026-01-01T00:00:00.000Z",
        endsAt: "2026-12-31T00:00:00.000Z",
      }).success,
    ).toBe(true);
  });

  it("accepts null startsAt/endsAt", () => {
    expect(campaignCreateSchema.safeParse({ ...base, startsAt: null, endsAt: null }).success).toBe(true);
  });

  it("rejects empty title", () => {
    expect(campaignCreateSchema.safeParse({ ...base, title: "" }).success).toBe(false);
  });

  it("rejects empty description", () => {
    expect(campaignCreateSchema.safeParse({ ...base, description: "" }).success).toBe(false);
  });

  it("rejects invalid slug (uppercase)", () => {
    expect(campaignCreateSchema.safeParse({ ...base, slug: "Summer-2026" }).success).toBe(false);
  });

  it("rejects invalid slug (spaces)", () => {
    expect(campaignCreateSchema.safeParse({ ...base, slug: "summer 2026" }).success).toBe(false);
  });
});

describe("campaignUpdateSchema", () => {
  it("requires id", () => {
    expect(campaignUpdateSchema.safeParse({ title: "New" }).success).toBe(false);
  });

  it("accepts partial update with id", () => {
    expect(
      campaignUpdateSchema.safeParse({ id: "abc12345678901234567890", title: "New Title" }).success,
    ).toBe(true);
  });

  it("accepts isActive toggle", () => {
    expect(
      campaignUpdateSchema.safeParse({ id: "abc12345678901234567890", isActive: false }).success,
    ).toBe(true);
  });
});

describe("campaignDeleteSchema", () => {
  it("accepts valid id", () => {
    expect(campaignDeleteSchema.safeParse({ id: "abc12345678901234567890" }).success).toBe(true);
  });

  it("rejects empty id", () => {
    expect(campaignDeleteSchema.safeParse({ id: "" }).success).toBe(false);
  });
});
