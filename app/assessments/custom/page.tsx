import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { CustomAssessmentsClient } from "@/components/assessment/custom-assessments-client";

export default async function CustomAssessmentsPage() {
  const { session, record } = await getCurrent();
  if (!session || !record) redirect("/sign-in");

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1>Custom Assessments</h1>
          <p className="mut" style={{ marginTop: 8 }}>Build personalized practice tests from the question bank.</p>
        </div>
      </div>
      <CustomAssessmentsClient userId={record.id} careerStage={record.careerStage} />
    </div>
  );
}