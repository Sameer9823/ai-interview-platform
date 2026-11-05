import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PlanClient } from "@/components/plan/plan-client";
import type { Level } from "@/lib/content/types";

export default async function PlanPage() {
  const { session, record } = await getCurrent();
  if (!session || !record) redirect("/sign-in");

  return (
    <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "24px 16px" }}>
      <h1>Preparation Plan</h1>
      <p className="mut" style={{ marginTop: 8, maxWidth: "42.5rem" }}>
        Create and track your personalized interview preparation plan with AI-generated recommendations.
      </p>
      <PlanClient
        initialData={{
          userId: record.id,
          careerStage: record.careerStage,
          targetRole: record.profile?.targetRole ?? null,
          experienceLevel: (record.profile?.experienceLevel as Level | null | undefined) ?? null,
          skills: record.profile?.skills ?? [],
          skillsToImprove: record.profile?.skillsToImprove ?? [],
          goals: record.goals,
        }}
      />
    </div>
  );
}
