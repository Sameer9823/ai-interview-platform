import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AssessmentTakingClient } from "@/components/assessment/assessment-taking-client";

export default async function AssessmentStartPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ attemptId: string }> }) {
  const { session, record } = await getCurrent();
  if (!session || !record) redirect("/sign-in");

  const { slug } = await params;
  const { attemptId } = await searchParams;

  if (!attemptId) redirect(`/assessments/${slug}`);

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0" }}>
      <AssessmentTakingClient
        slug={slug}
        attemptId={attemptId}
        userId={record.id}
        careerStage={record.careerStage}
      />
    </div>
  );
}