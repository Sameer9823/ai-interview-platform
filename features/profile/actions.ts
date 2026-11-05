"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { profileSchemaFor, goalsSchema, preferencesSchema, deleteAccountSchema } from "@/lib/validation";
import { requireUser } from "@/lib/auth/guard";
import { verifyPassword } from "@/lib/auth/password";
import { clearSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { clearSaved } from "@/lib/content/search";
import { toProfile } from "@/lib/data/profile-mapper";
import { fieldErrors, type FormState } from "@/lib/utils/form";

export async function updateProfileAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("/profile");
  const parsed = profileSchemaFor(user.careerStage!).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const { name, ...rest } = parsed.data;
  await db.user.update({
    where: { id: user.id },
    data: {
      name,
      profile: {
        upsert: {
          create: toProfile(rest) as any,
          update: toProfile(rest) as any,
        },
      },
    },
  });

  await db.activityLog.create({ data: { userId: user.id, type: "PROFILE_UPDATED" } });
  revalidatePath("/", "layout");
  return { ok: true, message: "Profile saved" };
}

export async function updateGoalsAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("/goals");
  const parsed = goalsSchema.safeParse({ goals: fd.getAll("goals") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  await db.$transaction(async (tx) => {
    await tx.preparationGoal.deleteMany({ where: { userId: user.id } });
    if (parsed.data.goals.length > 0) {
      await tx.preparationGoal.createMany({
        data: parsed.data.goals.map((category) => ({ userId: user.id, category })),
      });
    }
    await tx.activityLog.create({ data: { userId: user.id, type: "GOALS_UPDATED", metadata: { goals: parsed.data.goals } } });
  });

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

  await db.userPreference.update({
    where: { userId: user.id },
    data: {
      theme: parsed.data.theme,
      emailNotifications: parsed.data.emailNotifications,
      productUpdates: parsed.data.productUpdates,
    },
  });

  (await cookies()).set("ip-theme", parsed.data.theme === "LIGHT" ? "light" : "dark", { path: "/", maxAge: 31536000, sameSite: "lax" });
  await db.activityLog.create({ data: { userId: user.id, type: "PREFERENCES_UPDATED", metadata: { theme: parsed.data.theme } } });
  revalidatePath("/", "layout");
  return { ok: true, message: "Preferences saved" };
}

export async function deleteAccountAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("/settings/security");
  const parsed = deleteAccountSchema.safeParse({ password: fd.get("password"), confirmation: fd.get("confirmation") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser || !(await verifyPassword(parsed.data.password, dbUser.passwordHash))) return { errors: { password: "Password is incorrect" } };

  await db.user.delete({ where: { id: user.id } });
  clearSaved(user.id);
  await clearSession();
  redirect("/");
}
