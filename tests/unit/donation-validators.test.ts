import { describe, it, expect } from "vitest";
import { donationIntentSchema, donationRefundSchema } from "@/lib/validators/donations";

describe("donationIntentSchema", () => {
  const base = {
    provider: "STRIPE" as const,
    amountCents: 5000,
    currency: "USD",
    donorEmail: "donor@test.com",
    recurring: false,
  };

  it("accepts valid Stripe intent", () => {
    expect(donationIntentSchema.safeParse(base).success).toBe(true);
  });

  it("accepts all four providers", () => {
    for (const provider of ["STRIPE", "PESAPAL", "MTN_MOMO", "AIRTEL_MONEY"] as const) {
      expect(donationIntentSchema.safeParse({ ...base, provider }).success).toBe(true);
    }
  });

  it("rejects unknown provider", () => {
    expect(donationIntentSchema.safeParse({ ...base, provider: "PAYPAL" }).success).toBe(false);
  });

  it("rejects amount below minimum (100 cents)", () => {
    expect(donationIntentSchema.safeParse({ ...base, amountCents: 99 }).success).toBe(false);
  });

  it("accepts minimum amount (100 cents)", () => {
    expect(donationIntentSchema.safeParse({ ...base, amountCents: 100 }).success).toBe(true);
  });

  it("rejects amount above maximum", () => {
    expect(donationIntentSchema.safeParse({ ...base, amountCents: 100_000_001 }).success).toBe(false);
  });

  it("rejects non-integer amount", () => {
    expect(donationIntentSchema.safeParse({ ...base, amountCents: 50.5 }).success).toBe(false);
  });

  it("rejects currency not exactly 3 chars", () => {
    expect(donationIntentSchema.safeParse({ ...base, currency: "US" }).success).toBe(false);
    expect(donationIntentSchema.safeParse({ ...base, currency: "USDD" }).success).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(donationIntentSchema.safeParse({ ...base, donorEmail: "not-email" }).success).toBe(false);
  });

  it("accepts optional campaignSlug", () => {
    expect(donationIntentSchema.safeParse({ ...base, campaignSlug: "summer-2026" }).success).toBe(true);
  });

  it("accepts optional donorName", () => {
    expect(donationIntentSchema.safeParse({ ...base, donorName: "Jane Doe" }).success).toBe(true);
  });

  it("rejects donorName over 200 chars", () => {
    expect(donationIntentSchema.safeParse({ ...base, donorName: "a".repeat(201) }).success).toBe(false);
  });

  it("defaults recurring to false", () => {
    const withoutRecurring = Object.fromEntries(
      Object.entries(base).filter(([key]) => key !== "recurring"),
    );
    const result = donationIntentSchema.parse(withoutRecurring);
    expect(result.recurring).toBe(false);
  });

  it("accepts recurring: true", () => {
    expect(donationIntentSchema.safeParse({ ...base, recurring: true }).success).toBe(true);
  });
});

describe("donationRefundSchema", () => {
  const validId = "cjld2cjxh0000qzrmn831i7rn";

  it("accepts id alone (full refund)", () => {
    expect(donationRefundSchema.safeParse({ id: validId }).success).toBe(true);
  });

  it("accepts id with reason", () => {
    expect(donationRefundSchema.safeParse({ id: validId, reason: "Donor requested" }).success).toBe(true);
  });

  it("accepts id with partial amountCents", () => {
    expect(donationRefundSchema.safeParse({ id: validId, amountCents: 2500 }).success).toBe(true);
  });

  it("rejects amountCents of 0", () => {
    expect(donationRefundSchema.safeParse({ id: validId, amountCents: 0 }).success).toBe(false);
  });

  it("rejects negative amountCents", () => {
    expect(donationRefundSchema.safeParse({ id: validId, amountCents: -100 }).success).toBe(false);
  });

  it("rejects reason over 200 chars", () => {
    expect(donationRefundSchema.safeParse({ id: validId, reason: "x".repeat(201) }).success).toBe(false);
  });

  it("rejects missing id", () => {
    expect(donationRefundSchema.safeParse({ reason: "test" }).success).toBe(false);
  });

  it("rejects empty id", () => {
    expect(donationRefundSchema.safeParse({ id: "" }).success).toBe(false);
  });
});
