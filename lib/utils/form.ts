import type { ZodError } from "zod";

export interface FormState {
  errors?: Record<string, string>;
  formError?: string;
  ok?: boolean;
  message?: string;
  values?: Record<string, string>;
}

export function fieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    // Zod's own wording for a tampered union discriminator is not meant for people.
    const message = issue.code === "invalid_union_discriminator" ? "Choose your career stage" : issue.message;
    if (!(key in out)) out[key] = message;
  }
  return out;
}

export function formValues(fd: FormData, keys: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of keys) {
    const v = fd.get(k);
    out[k] = typeof v === "string" ? v : "";
  }
  return out;
}
