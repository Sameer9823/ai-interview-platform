"use server";
import { redirect } from "next/navigation";
import { onboardingSchema } from "@/lib/validation";
import { requireUser } from "@/lib/auth/guard";
import { db } from "@/lib/db/client";
import { toProfile } from "@/lib/data/profile-mapper";
import { dashboardFor } from "@/lib/permissions";
import { fieldErrors, type FormState } from "@/lib/utils/form";

export async function completeOnboardingAction(values: Record<string, string | string[]>): Promise<FormState> {
  const user = await requireUser("/onboarding");
  const parsed = onboardingSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const { careerStage, goals, ...profile } = parsed.data;

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        careerStage,
        onboardingCompletedAt: new Date(),
        profile: {
          upsert: {
            create: toProfile(profile) as any,
            update: toProfile(profile) as any,
          },
        },
      },
    });

    if (goals && goals.length > 0) {
      await tx.preparationGoal.deleteMany({ where: { userId: user.id } });
      await tx.preparationGoal.createMany({
        data: goals.map((category) => ({ userId: user.id, category })),
      });
    }

    await tx.activityLog.create({
      data: { userId: user.id, type: "ONBOARDING_COMPLETED", metadata: { careerStage, goals } },
    });

    await tx.notification.create({
      data: { userId: user.id, type: "SYSTEM", title: "Welcome!", body: "Your onboarding is complete. Let's start preparing!" },
    });
  });

  redirect(dashboardFor(careerStage));
}
