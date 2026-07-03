import { describe, it, expect } from "vitest";
import { clientIdentifier } from "@/lib/ratelimit";

// clientIdentifier is a pure function we can test without DB
describe("clientIdentifier", () => {
  const makeReq = (headers: Record<string, string>) =>
    ({ headers: { get: (k: string) => headers[k] ?? null } } as unknown as Request);

  it("returns first IP from x-forwarded-for", () => {
    const req = makeReq({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(clientIdentifier(req)).toBe("1.2.3.4");
  });

  it("trims whitespace from x-forwarded-for", () => {
    const req = makeReq({ "x-forwarded-for": "  1.2.3.4  , 5.6.7.8" });
    expect(clientIdentifier(req)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when no x-forwarded-for", () => {
    const req = makeReq({ "x-real-ip": "9.10.11.12" });
    expect(clientIdentifier(req)).toBe("9.10.11.12");
  });

  it("returns 'unknown' when no IP headers present", () => {
    const req = makeReq({});
    expect(clientIdentifier(req)).toBe("unknown");
  });

  it("prefers x-forwarded-for over x-real-ip", () => {
    const req = makeReq({ "x-forwarded-for": "1.1.1.1", "x-real-ip": "2.2.2.2" });
    expect(clientIdentifier(req)).toBe("1.1.1.1");
  });
});
