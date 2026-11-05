import Link from "next/link";
import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui";
import { MockInterviewHistoryClient } from "@/components/mock-interview/mock-interview-history-client";

export default async function MockInterviewHistoryPage() {
  const { session, record } = await getCurrent();
  if (!session || !record) redirect("/sign-in");

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1>Interview History</h1>
          <p className="mut" style={{ marginTop: 8 }}>Track your mock interview progress and performance over time.</p>
        </div>
        <Link href="/mock-interviews/new">
          <Button variant="solid">New Mock Interview</Button>
        </Link>
      </div>
      <MockInterviewHistoryClient userId={record.id} />
    </div>
  );
}