import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { JobMatchClient } from "@/components/resume/job-match-client";

export default async function JobMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { session, record } = await getCurrent();
  if (!session || !record) redirect("/sign-in");

  const { id } = await params;

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "24px 16px" }}>
      <JobMatchClient resumeId={id} userId={record.id} />
    </div>
  );
}