import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guard";
import { ProfessionalDashboard } from "@/features/professional/professional-dashboard";

export const metadata: Metadata = { title: "Professional dashboard" };
export default async function Page() {
  return <ProfessionalDashboard user={await requireUser("/professional/dashboard")} />;
}
