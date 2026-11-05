import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { SkillGapsClient } from "@/components/resume/skill-gaps-client";

export default async function SkillGapsPage({ params }: { params: Promise<{ id: string }> }) {
  const { session, record } = await getCurrent();
  if (!session || !record) redirect("/sign-in");

  const { id } = await params;

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "24px 16px" }}>
      <SkillGapsClient resumeId={id} userId={record.id} />
    </div>
  );
}