import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guard";
import { StudentDashboard } from "@/features/student/student-dashboard";

export const metadata: Metadata = { title: "Student dashboard" };
export default async function Page() {
  return <StudentDashboard user={await requireUser("/student/dashboard")} />;
}
