/**
 * Accepts only same-origin relative paths. Anything else returns the fallback.
 * Blocks protocol-relative URLs (//evil.com), backslash tricks and control characters.
 */
export function safeRedirect(target: unknown, fallback = "/"): string {
  if (typeof target !== "string" || target.length === 0 || target.length > 2048) return fallback;
  if (!target.startsWith("/") || target.startsWith("//")) return fallback;
  if (target.includes("\\") || /[\u0000-\u001f\u007f]/.test(target)) return fallback;
  // Also reject percent-encoded control characters and backslashes.
  try {
    const decoded = decodeURIComponent(target);
    if (decoded.includes("\\") || /[\u0000-\u001f\u007f]/.test(decoded)) return fallback;
  } catch {
    return fallback;
  }
  try {
    const base = "http://internal.invalid";
    const url = new URL(target, base);
    if (url.origin !== base) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
