import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { MockInterviewDashboardClient } from "@/components/mock-interview/mock-interview-dashboard-client";

export default async function MockInterviewsPage() {
  const { session, record } = await getCurrent();
  if (!session || !record) redirect("/sign-in");

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1>Mock Interviews</h1>
          <p className="mut" style={{ marginTop: 8 }}>
            Practice realistic interviews with AI-powered follow-ups and detailed feedback.
          </p>
        </div>
      </div>
      <MockInterviewDashboardClient initialData={{ userId: record.id, careerStage: record.careerStage }} />
    </div>
  );
}