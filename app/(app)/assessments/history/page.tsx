import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui";
import { AssessmentHistoryClient } from "@/components/assessment/assessment-history-client";

export default async function AssessmentHistoryPage() {
  const { session, record } = await getCurrent();
  if (!session || !record) redirect("/sign-in");

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1>Assessment History</h1>
          <p className="mut" style={{ marginTop: 8 }}>Track your assessment attempts and progress over time.</p>
        </div>
        <Link href="/assessments/custom">
          <Button variant="solid">Create Custom Assessment</Button>
        </Link>
      </div>
      <AssessmentHistoryClient userId={record.id} />
    </div>
  );
}