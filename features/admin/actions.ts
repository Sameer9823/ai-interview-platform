"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import * as svc from "@/lib/content/service";
import { commitImport, stageImport, MAX_BYTES } from "@/lib/content/import/pipeline";
import { PUBLICATION, type ContentKind, type Publication } from "@/lib/content/types";
import { safeRedirect } from "@/lib/utils/safe-redirect";
import type { FormState } from "@/lib/utils/form";

/** Every function here starts with requireAdmin(). The role comes from the stored account, never from the request. */
function raw(fd: FormData): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const k of new Set(fd.keys())) {
    if (k.startsWith("$")) continue;
    const all = fd.getAll(k).filter((v): v is string => typeof v === "string");
    o[k] = all.length > 1 ? all : (all[0] ?? "");
  }
  return o;
}
const echo = (o: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Array.isArray(v) ? v.join(",") : String(v)]));
function problem(e: unknown, input: Record<string, unknown>): FormState {
  if (e instanceof svc.ContentError)
    return {
      errors: e.fieldErrors,
      formError: e.reasons.length ? `${e.message}. ${e.reasons.join(" • ")}` : Object.keys(e.fieldErrors).length ? undefined : e.message,
      values: echo(input),
    };
  throw e;
}
const flash = (back: string, kind: "ok" | "error", msg: string) =>
  `${safeAdmin(back)}${back.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(msg.slice(0, 400))}`;
const safeAdmin = (back: unknown) => {
  const b = safeRedirect(back, "/admin");
  return b.startsWith("/admin") ? b : "/admin";
};

type Saver = (actor: svc.Actor, input: unknown, id?: string) => { id: string };
async function save(saver: Saver, listPath: string, editPath: (id: string) => string, id: string, fd: FormData): Promise<FormState> {
  const { actor } = await requireAdmin();
  const input = raw(fd);
  let saved: { id: string };
  try {
    saved = saver(actor, input, id || undefined);
  } catch (e) {
    return problem(e, input);
  }
  revalidatePath("/", "layout");
  redirect(`${editPath(saved.id)}?ok=${encodeURIComponent("Saved")}`);
  return { ok: true };
}
export async function saveCompanyAction(id: string, _: FormState, fd: FormData) {
  return save(svc.saveCompany, "/admin/companies", (i) => `/admin/companies/${i}`, id, fd);
}
export async function saveQuestionAction(id: string, _: FormState, fd: FormData) {
  return save(svc.saveQuestion, "/admin/questions", (i) => `/admin/questions/${i}`, id, fd);
}
export async function saveExperienceAction(id: string, _: FormState, fd: FormData) {
  return save(svc.saveExperience, "/admin/experiences", (i) => `/admin/experiences/${i}`, id, fd);
}
export async function saveSourceAction(id: string, _: FormState, fd: FormData) {
  return save(svc.saveSource, "/admin/sources", (i) => `/admin/sources/${i}`, id, fd);
}
export async function saveProcessAction(id: string, _: FormState, fd: FormData) {
  return save(svc.saveProcess, "/admin/companies", (i) => `/admin/processes/${i}`, id, fd);
}

export async function createCategoryAction(_: FormState, fd: FormData): Promise<FormState> {
  const { actor } = await requireAdmin();
  const input = raw(fd);
  try {
    const c = svc.createCategory(actor, input);
    revalidatePath("/", "layout");
    return { ok: true, message: `Created ${c.name}` };
  } catch (e) {
    return problem(e, input);
  }
}
export async function createTagAction(_: FormState, fd: FormData): Promise<FormState> {
  const { actor } = await requireAdmin();
  const input = raw(fd);
  try {
    const t = svc.createTag(actor, input);
    return { ok: true, message: `Tag ${t.name} is ready` };
  } catch (e) {
    return problem(e, input);
  }
}

/** Status changes use plain forms and a redirect with a message, so they work without JavaScript. */
export async function setStatusAction(kind: ContentKind, id: string, fd: FormData) {
  const { actor } = await requireAdmin();
  const back = safeAdmin(fd.get("back")),
    to = String(fd.get("to") ?? "") as Publication,
    note = String(fd.get("note") ?? "");
  let target: string;
  try {
    if (!(PUBLICATION as readonly string[]).includes(to)) throw new svc.ContentError("VALIDATION", "Unknown status");
    svc.setPublication(actor, kind, id, to, note);
    revalidatePath("/", "layout");
    target = flash(back, "ok", `Moved to ${to.toLowerCase().replace("_", " ")}`);
  } catch (e) {
    if (!(e instanceof svc.ContentError)) throw e;
    target = flash(back, "error", [e.message, ...e.reasons].join(". "));
  }
  redirect(target);
}
export async function bulkStatusAction(kind: ContentKind, fd: FormData) {
  const { actor } = await requireAdmin();
  const back = safeAdmin(fd.get("back")),
    to = String(fd.get("to") ?? "") as Publication;
  let target: string;
  try {
    const ids = fd.getAll("ids").filter((v): v is string => typeof v === "string");
    if (!(PUBLICATION as readonly string[]).includes(to)) throw new svc.ContentError("VALIDATION", "Choose a status");
    const r = svc.bulkSetPublication(actor, kind, ids, to, fd.get("confirm") === "on");
    revalidatePath("/", "layout");
    const bad = r.filter((x) => !x.ok);
    target = flash(
      back,
      bad.length ? "error" : "ok",
      `${r.length - bad.length} applied, ${bad.length} refused${bad.length ? `: ${bad.map((x) => x.reason).join(" | ")}` : ""}`,
    );
  } catch (e) {
    if (!(e instanceof svc.ContentError)) throw e;
    target = flash(back, "error", [e.message, ...Object.values(e.fieldErrors)].join(". "));
  }
  redirect(target);
}
export async function markCheckedAction(id: string) {
  const { actor } = await requireAdmin();
  svc.markSourceChecked(actor, id);
  revalidatePath("/admin/sources");
  redirect(flash(`/admin/sources/${id}`, "ok", "Marked as checked"));
}

export async function stageImportAction(fd: FormData) {
  const { actor } = await requireAdmin();
  let target: string;
  try {
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0)
      throw new svc.ContentError("VALIDATION", "Choose a file", { file: "Choose a .csv or .json file" });
    if (file.size > MAX_BYTES)
      throw new svc.ContentError("VALIDATION", "Too large", { file: `The file is larger than ${MAX_BYTES / 1000} KB` });
    const kind = fd.get("kind") === "companies" ? "companies" : "questions";
    const job = stageImport({
      actor,
      kind,
      sourceId: String(fd.get("sourceId") ?? ""),
      filename: file.name,
      mime: file.type,
      bytes: new Uint8Array(await file.arrayBuffer()),
    });
    revalidatePath("/admin/imports");
    target = `/admin/imports/${job.id}`;
  } catch (e) {
    if (!(e instanceof svc.ContentError)) throw e;
    target = flash("/admin/imports", "error", [e.message, ...Object.values(e.fieldErrors), ...e.reasons].join(". "));
  }
  redirect(target);
}
export async function commitImportAction(id: string, fd: FormData) {
  const { actor } = await requireAdmin();
  const back = `/admin/imports/${id}`;
  let target: string;
  try {
    const job = commitImport(actor, id, { confirm: fd.get("confirm") === "on" });
    revalidatePath("/", "layout");
    target = flash(back, job.status === "COMMITTED" ? "ok" : "error", job.message);
  } catch (e) {
    if (!(e instanceof svc.ContentError)) throw e;
    target = flash(back, "error", [e.message, ...Object.values(e.fieldErrors), ...e.reasons].join(". "));
  }
  redirect(target);
}
