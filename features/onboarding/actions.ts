"use server";
import { redirect } from "next/navigation";
import { onboardingSchema } from "@/lib/validation";
import { requireUser } from "@/lib/auth/guard";
import { addActivity } from "@/lib/data/dev-store";
import { toProfile } from "@/lib/data/profile-mapper";
import { dashboardFor } from "@/lib/permissions";
import { fieldErrors, type FormState } from "@/lib/utils/form";

export async function completeOnboardingAction(values: Record<string, string | string[]>): Promise<FormState> {
  const user = await requireUser("/onboarding");
  const parsed = onboardingSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const { careerStage, goals, ...profile } = parsed.data;
  user.careerStage = careerStage;
  user.profile = toProfile(profile);
  user.goals = goals;
  user.onboardingDone = true;
  addActivity(user, "Onboarding completed", true);
  redirect(dashboardFor(careerStage));
}
