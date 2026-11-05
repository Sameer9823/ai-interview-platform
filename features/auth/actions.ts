"use server";
import { redirect } from "next/navigation";
import { signUpSchema, signInSchema } from "@/lib/validation";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, clearSession } from "@/lib/auth/session";
import { rateLimit, resetRateLimit } from "@/lib/auth/rate-limit";
import { db } from "@/lib/db/client";
import { dashboardFor } from "@/lib/permissions";
import { safeRedirect } from "@/lib/utils/safe-redirect";
import { fieldErrors, formValues, type FormState } from "@/lib/utils/form";

export async function signUpAction(_: FormState, fd: FormData): Promise<FormState> {
  const values = formValues(fd, ["name", "email"]);
  const parsed = signUpSchema.safeParse({
    ...values,
    password: fd.get("password"),
    confirmPassword: fd.get("confirmPassword"),
    acceptTerms: fd.get("acceptTerms") === "on",
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const email = parsed.data.email.trim().toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { errors: { email: "An account with this email already exists" }, values };

  const passwordHash = await hashPassword(parsed.data.password);
  const devAdmin = process.env.ALLOW_DEV_ADMIN === "1" && !!process.env.DEV_ADMIN_EMAIL && process.env.DEV_ADMIN_EMAIL.trim().toLowerCase() === email;

  const user = await db.user.create({
    data: {
      email,
      name: parsed.data.name,
      passwordHash,
      emailVerified: new Date(),
      platformRole: devAdmin ? "ADMIN" : "NONE",
      profile: { create: { preferredLanguage: "en", skillsToImprove: [] } },
      preference: { create: { theme: "DARK", emailNotifications: true, productUpdates: false } },
    },
  });

  await db.activityLog.create({
    data: { userId: user.id, type: "ACCOUNT_CREATED", metadata: { name: user.name } },
  });

  await createSession(user.id);
  redirect("/onboarding");
}

export async function signInAction(_: FormState, fd: FormData): Promise<FormState> {
  const values = formValues(fd, ["email", "next"]);
  const parsed = signInSchema.safeParse({ email: values.email, password: fd.get("password") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const email = parsed.data.email.trim().toLowerCase();
  const key = `signin:${email}`;
  const limit = rateLimit(key);
  if (!limit.ok) return { formError: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSec / 60)} minutes.`, values };

  const user = await db.user.findUnique({ where: { email } });
  const ok = await verifyPassword(parsed.data.password, user?.passwordHash);
  if (!user || !ok) return { formError: "Email or password is incorrect.", values };

  resetRateLimit(key);
  await db.activityLog.create({ data: { userId: user.id, type: "SIGNED_IN" } });
  await createSession(user.id);
  redirect(safeRedirect(values.next, user.careerStage ? dashboardFor(user.careerStage) : "/onboarding"));
}

export async function signOutAction() {
  await clearSession();
  redirect("/");
}
