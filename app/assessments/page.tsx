import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AssessmentCatalogClient } from "@/components/assessment/assessment-catalog-client";

const ASSESSMENT_TYPES = [
  "APTITUDE",
  "TECHNICAL",
  "CODING",
  "READINESS",
  "CUSTOM",
] as const;

const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
const CAREER_STAGES = ["STUDENT", "FRESHER", "PROFESSIONAL"] as const;

export default async function AssessmentsPage() {
  const { session, record } = await getCurrent();
  if (!session || !record) redirect("/sign-in");

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1>Assessment Catalog</h1>
          <p className="mut" style={{ marginTop: 8 }}>
            Browse and take assessments to test your knowledge and prepare for interviews.
          </p>
        </div>
        <a href="/assessments/custom" style={{ textDecoration: "none" }}>
          <button className="btn solid">Create Custom Assessment</button>
        </a>
      </div>
      <AssessmentCatalogClient
        initialData={{ careerStage: record.careerStage }}
        assessmentTypes={ASSESSMENT_TYPES}
        difficulties={DIFFICULTIES}
        careerStages={CAREER_STAGES}
      />
    </div>
  );
}