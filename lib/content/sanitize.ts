/** Content is stored and rendered as plain text. No HTML or Markdown is interpreted anywhere. */
export function cleanText(input: unknown, max = 5000): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim()
    .slice(0, max);
}

const PRIVATE_V4 = [
  /^0\./,
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^22[4-9]\./,
  /^2[3-5]\d\./,
];

/** Allows only public http(s) URLs. Used for every stored link and for any future fetcher (SSRF guard). */
export function safeExternalUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 2048) return null;
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (u.username || u.password) return null;
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    !host ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".lan")
  )
    return null;
  if (/^[0-9.]+$/.test(host)) {
    if (host.split(".").length !== 4 || PRIVATE_V4.some((r) => r.test(host))) return null;
  } else if (host.includes(":")) {
    if (host === "::1" || host === "::" || /^(fc|fd|fe[89ab])/.test(host) || host.startsWith("::ffff:")) return null;
  } else if (/^(0x[0-9a-f]+|\d+)$/i.test(host)) return null; // decimal or hex encoded IPv4
  return u.toString();
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export const normalizeKey = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Neutralises spreadsheet formulas in exported CSV cells. */
export function csvCell(value: unknown): string {
  let s = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
