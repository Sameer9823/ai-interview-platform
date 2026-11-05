import Link from "next/link";
import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { MockInterviewConfigClient } from "@/components/mock-interview/mock-interview-config-client";
import { db } from "@/lib/db/client";

export default async function NewMockInterviewPage() {
  const { session, record } = await getCurrent();
  if (!session || !record) redirect("/sign-in");

  const [companies, resumes] = await Promise.all([
    db.company.findMany({
      where: { publication: "PUBLISHED" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.resumeVersion.findMany({
      where: { resume: { userId: record.id }, isActive: true },
      select: { id: true, versionNumber: true, targetRole: true, fileName: true },
      orderBy: { versionNumber: "desc" },
    }),
  ]);

  return (
    <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Link href="/mock-interviews" style={{ textDecoration: "none", color: "var(--color-primary)", marginBottom: 8, display: "inline-block" }}>
            ← Back to Dashboard
          </Link>
          <h1>New Mock Interview</h1>
          <p className="mut" style={{ marginTop: 8 }}>Configure and start a personalized practice interview.</p>
        </div>
      </div>
      <MockInterviewConfigClient companies={companies} resumes={resumes} careerStage={record.careerStage} />
    </div>
  );
}