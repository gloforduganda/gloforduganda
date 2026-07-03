import { describe, it, expect } from "vitest";
import { toCsv, csvResponse } from "@/lib/services/exports/csv";

describe("toCsv", () => {
  it("returns empty string for empty array", () => {
    expect(toCsv([])).toBe("");
  });

  it("generates header row from first object keys", () => {
    const result = toCsv([{ name: "Alice", age: 30 }]);
    const lines = result.split("\r\n");
    expect(lines[0]).toBe("name,age");
  });

  it("generates data rows", () => {
    const result = toCsv([{ name: "Alice", age: 30 }, { name: "Bob", age: 25 }]);
    const lines = result.split("\r\n");
    expect(lines[1]).toBe("Alice,30");
    expect(lines[2]).toBe("Bob,25");
  });

  it("escapes values containing commas", () => {
    const result = toCsv([{ name: "Smith, John" }]);
    expect(result).toContain('"Smith, John"');
  });

  it("escapes values containing double quotes", () => {
    const result = toCsv([{ name: 'He said "hello"' }]);
    expect(result).toContain('"He said ""hello"""');
  });

  it("escapes values containing newlines", () => {
    const result = toCsv([{ note: "line1\nline2" }]);
    expect(result).toContain('"line1\nline2"');
  });

  it("serializes Date objects as ISO strings", () => {
    const d = new Date("2026-01-15T10:00:00.000Z");
    const result = toCsv([{ createdAt: d }]);
    expect(result).toContain("2026-01-15T10:00:00.000Z");
  });

  it("serializes null/undefined as empty string", () => {
    const result = toCsv([{ name: null, phone: undefined }]);
    const lines = result.split("\r\n");
    expect(lines[1]).toBe(",");
  });

  it("serializes objects as JSON", () => {
    const result = toCsv([{ meta: { key: "val" } }]);
    // RFC-4180: JSON contains quotes so the field is wrapped in double-quotes
    // and internal quotes are doubled: {"key":"val"} → "{""key"":""val""}"
    expect(result).toContain('"{""key"":""val""}"');
  });

  it("handles multiple rows consistently", () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({ id: i, label: `item-${i}` }));
    const result = toCsv(rows);
    const lines = result.split("\r\n");
    expect(lines).toHaveLength(6); // header + 5 rows
  });
});

describe("csvResponse", () => {
  it("returns 200 status", () => {
    const res = csvResponse("a,b\r\n1,2", "test.csv");
    expect(res.status).toBe(200);
  });

  it("sets correct Content-Type header", () => {
    const res = csvResponse("a,b", "test.csv");
    expect(res.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
  });

  it("sets Content-Disposition with filename", () => {
    const res = csvResponse("a,b", "donors-2026-01-01.csv");
    expect(res.headers.get("Content-Disposition")).toBe('attachment; filename="donors-2026-01-01.csv"');
  });

  it("sets Cache-Control no-store", () => {
    const res = csvResponse("a,b", "test.csv");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});
