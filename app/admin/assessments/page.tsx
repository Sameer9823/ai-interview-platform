import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AdminAssessmentsClient } from "@/components/assessment/admin-assessments-client";

export default async function AdminAssessmentsPage() {
  const { session } = await getCurrent();
  if (!session) redirect("/sign-in");
  if (session.platformRole !== "ADMIN") redirect("/");

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "24px 16px" }}>
      <AdminAssessmentsClient />
    </div>
  );
}