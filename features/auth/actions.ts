"use server";
import { redirect } from "next/navigation";
import { signUpSchema, signInSchema } from "@/lib/validation";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, clearSession } from "@/lib/auth/session";
import { rateLimit, resetRateLimit } from "@/lib/auth/rate-limit";
import { createUser, findByEmail, addActivity } from "@/lib/data/dev-store";
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
  if (findByEmail(parsed.data.email)) return { errors: { email: "An account with this email already exists" }, values };

  const user = createUser({ email: parsed.data.email, name: parsed.data.name, passwordHash: await hashPassword(parsed.data.password) });
  addActivity(user, "Account created");
  await createSession(user.id);
  redirect("/onboarding");
}

export async function signInAction(_: FormState, fd: FormData): Promise<FormState> {
  const values = formValues(fd, ["email", "next"]);
  const parsed = signInSchema.safeParse({ email: values.email, password: fd.get("password") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const key = `signin:${parsed.data.email}`;
  const limit = rateLimit(key);
  if (!limit.ok) return { formError: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSec / 60)} minutes.`, values };

  const user = findByEmail(parsed.data.email);
  const ok = await verifyPassword(parsed.data.password, user?.passwordHash);
  if (!user || !ok) return { formError: "Email or password is incorrect.", values };

  resetRateLimit(key);
  addActivity(user, "Signed in");
  await createSession(user.id);
  redirect(safeRedirect(values.next, user.careerStage ? dashboardFor(user.careerStage) : "/onboarding"));
}

export async function signOutAction() {
  await clearSession();
  redirect("/");
}
