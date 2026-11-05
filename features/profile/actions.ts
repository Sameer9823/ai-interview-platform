"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { profileSchemaFor, goalsSchema, preferencesSchema, deleteAccountSchema } from "@/lib/validation";
import { requireUser } from "@/lib/auth/guard";
import { verifyPassword } from "@/lib/auth/password";
import { clearSession } from "@/lib/auth/session";
import { addActivity, deleteUser } from "@/lib/data/dev-store";
import { clearSaved } from "@/lib/content/search";
import { toProfile } from "@/lib/data/profile-mapper";
import { fieldErrors, type FormState } from "@/lib/utils/form";

export async function updateProfileAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("/profile");
  // Schema comes from the server side career stage, never from a form field.
  const parsed = profileSchemaFor(user.careerStage!).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const { name, ...rest } = parsed.data;
  user.name = name;
  user.profile = toProfile(rest);
  addActivity(user, "Profile updated", true);
  revalidatePath("/", "layout");
  return { ok: true, message: "Profile saved" };
}

export async function updateGoalsAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("/goals");
  const parsed = goalsSchema.safeParse({ goals: fd.getAll("goals") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  user.goals = parsed.data.goals;
  addActivity(user, "Preparation goals updated", true);
  revalidatePath("/", "layout");
  return { ok: true, message: "Goals saved" };
}

export async function updatePreferencesAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("/settings/preferences");
  const parsed = preferencesSchema.safeParse({
    theme: fd.get("theme"),
    emailNotifications: fd.get("emailNotifications") === "on",
    productUpdates: fd.get("productUpdates") === "on",
  });
  if (!parsed.success || parsed.data.theme === "SYSTEM") return { errors: { theme: "Choose dark or light" } };

  user.prefs = { theme: parsed.data.theme, emailNotifications: parsed.data.emailNotifications, productUpdates: parsed.data.productUpdates };
  (await cookies()).set("ip-theme", parsed.data.theme === "LIGHT" ? "light" : "dark", { path: "/", maxAge: 31536000, sameSite: "lax" });
  addActivity(user, "Preferences updated", true);
  revalidatePath("/", "layout");
  return { ok: true, message: "Preferences saved" };
}

export async function deleteAccountAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("/settings/security");
  const parsed = deleteAccountSchema.safeParse({ password: fd.get("password"), confirmation: fd.get("confirmation") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  if (!(await verifyPassword(parsed.data.password, user.passwordHash))) return { errors: { password: "Password is incorrect" } };

  deleteUser(user.id);
  clearSaved(user.id);
  await clearSession();
  redirect("/");
}
