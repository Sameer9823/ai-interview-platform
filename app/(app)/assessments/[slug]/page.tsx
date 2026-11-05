import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AssessmentDetailClient } from "@/components/assessment/assessment-detail-client";

export default async function AssessmentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { session, record } = await getCurrent();
  if (!session || !record) redirect("/sign-in");

  const { slug } = await params;

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "24px 16px" }}>
      <AssessmentDetailClient slug={slug} userId={record.id} careerStage={record.careerStage} />
    </div>
  );
}