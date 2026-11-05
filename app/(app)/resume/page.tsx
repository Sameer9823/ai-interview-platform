import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ResumeWorkspaceClient } from "@/components/resume/resume-workspace-client";

export default async function ResumePage() {
  const { session, record } = await getCurrent();
  if (!session || !record) redirect("/sign-in");

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "24px 16px" }}>
      <ResumeWorkspaceClient />
    </div>
  );
}