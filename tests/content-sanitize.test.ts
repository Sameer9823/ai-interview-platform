import { describe, expect, it } from "vitest";
import { cleanText, csvCell, normalizeKey, safeExternalUrl, slugify } from "@/lib/content/sanitize";

describe("cleanText", () => {
  it("removes tags, scripts, styles and control characters", () => {
    expect(cleanText("<b>Hi</b> <script>alert(1)</script>there<style>x{}</style>")).toBe("Hi there");
    expect(cleanText("a\u0000b\u0007c")).toBe("abc");
    expect(cleanText("<img src=x onerror=alert(1)>ok")).toBe("ok");
    expect(cleanText(42)).toBe("");
    expect(cleanText("x".repeat(50), 10)).toHaveLength(10);
  });
  it("leaves ordinary text and angle bracket math alone enough to stay readable", () => {
    expect(cleanText("Use 3 < 5 in loops")).toBe("Use 3 < 5 in loops");
  });
});

describe("safeExternalUrl (SSRF guard)", () => {
  it("accepts public http and https addresses", () => {
    expect(safeExternalUrl("https://example.com/a?b=1")).toBe("https://example.com/a?b=1");
    expect(safeExternalUrl("http://example.org")).toBe("http://example.org/");
  });
  it("rejects dangerous schemes", () => {
    for (const u of ["javascript:alert(1)", "file:///etc/passwd", "ftp://x.com", "data:text/html,hi", "gopher://x", "//evil.com"])
      expect(safeExternalUrl(u)).toBeNull();
  });
  it("rejects local and private network targets", () => {
    for (const u of [
      "http://localhost",
      "http://app.localhost",
      "http://127.0.0.1",
      "http://10.0.0.5",
      "http://172.16.0.1",
      "http://172.31.255.255",
      "http://192.168.1.1",
      "http://169.254.169.254/latest/meta-data",
      "http://0.0.0.0",
      "http://100.64.0.1",
      "http://[::1]/",
      "http://[fd00::1]/",
      "http://[fe80::1]/",
      "http://[::ffff:127.0.0.1]/",
      "http://db.internal",
      "http://printer.local",
      "http://2130706433/",
      "http://0x7f000001/",
      "http://127.1/",
    ])
      expect(safeExternalUrl(u), u).toBeNull();
  });
  it("rejects credentials, junk and very long values", () => {
    expect(safeExternalUrl("https://user:pw@example.com")).toBeNull();
    expect(safeExternalUrl("not a url")).toBeNull();
    expect(safeExternalUrl("")).toBeNull();
    expect(safeExternalUrl(null)).toBeNull();
    expect(safeExternalUrl("https://example.com/" + "a".repeat(2100))).toBeNull();
  });
  it("allows public addresses that merely look similar to private ones", () => {
    expect(safeExternalUrl("http://172.32.0.1")).not.toBeNull();
    expect(safeExternalUrl("http://8.8.8.8")).not.toBeNull();
  });
});

describe("helpers", () => {
  it("slugifies", () => {
    expect(slugify("Tata Consultancy Services (TCS)")).toBe("tata-consultancy-services-tcs");
    expect(slugify("Q&A: Café  ")).toBe("q-and-a-cafe");
    expect(slugify("!!!")).toBe("");
  });
  it("normalizes keys for duplicate detection", () => {
    expect(normalizeKey("  What IS a   Stack?! ")).toBe("what is a stack");
  });
  it("escapes csv cells and defuses formulas", () => {
    expect(csvCell("=1+1")).toBe("'=1+1");
    expect(csvCell("+1")).toBe("'+1");
    expect(csvCell("-1")).toBe("'-1");
    expect(csvCell("@a")).toBe("'@a");
    expect(csvCell("\tx")).toBe("'\tx".includes(",") ? '"\'\tx"' : "'\tx");
    expect(csvCell('say "hi", ok')).toBe('"say ""hi"", ok"');
    expect(csvCell("plain")).toBe("plain");
  });
});
