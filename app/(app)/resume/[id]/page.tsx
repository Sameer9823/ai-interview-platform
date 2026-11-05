import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ResumeDetailClient } from "@/components/resume/resume-detail-client";

export default async function ResumeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { session, record } = await getCurrent();
  if (!session || !record) redirect("/sign-in");

  const { id } = await params;

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "24px 16px" }}>
      <ResumeDetailClient resumeId={id} userId={record.id} />
    </div>
  );
}