import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PracticeClient } from "@/components/practice/practice-client";

const QUESTION_TYPES = [
  "MULTIPLE_CHOICE",
  "SINGLE_ANSWER",
  "SHORT_ANSWER",
  "LONG_ANSWER",
  "CODING",
  "SQL",
  "SCENARIO",
  "BEHAVIORAL",
  "SYSTEM_DESIGN",
  "COMMUNICATION",
] as const;

const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

export default async function PracticePage() {
  const { session, record } = await getCurrent();
  if (!session || !record) redirect("/sign-in");

  return (
    <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "24px 16px" }}>
      <h1>Practice Sessions</h1>
      <p className="mut" style={{ marginTop: 8, maxWidth: "42.5rem" }}>
        Create a practice session with AI-generated or published questions. Get instant AI evaluation and feedback.
      </p>
      <PracticeClient
        initialData={{
          userId: record.id,
          careerStage: record.careerStage,
          targetRole: record.profile?.targetRole ?? null,
          skills: record.profile?.skills ?? [],
          skillsToImprove: record.profile?.skillsToImprove ?? [],
          goals: record.goals,
        }}
        questionTypes={QUESTION_TYPES}
        difficulties={DIFFICULTIES}
      />
    </div>
  );
}
