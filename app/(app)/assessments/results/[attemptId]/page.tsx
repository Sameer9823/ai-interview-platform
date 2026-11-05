import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AssessmentResultsClient } from "@/components/assessment/assessment-results-client";

export default async function AssessmentResultsPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { session, record } = await getCurrent();
  if (!session || !record) redirect("/sign-in");

  const { attemptId } = await params;

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "24px 16px" }}>
      <AssessmentResultsClient attemptId={attemptId} userId={record.id} />
    </div>
  );
}