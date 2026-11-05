import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guard";
import { OnboardingWizard } from "@/features/onboarding/onboarding-wizard";

export const metadata: Metadata = { title: "Onboarding" };
export default async function Page() {
  await requireUser("/onboarding");
  return <OnboardingWizard />;
}
