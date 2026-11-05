import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { NewApplicationClient } from "@/components/applications/new-application-client";

export default async function NewApplicationPage() {
  const { session } = await getCurrent();
  if (!session) redirect("/sign-in?next=/applications/new");

  const [opportunities, resumeVersions, companies] = await Promise.all([
    db.careerOpportunity.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, title: true, company: { select: { name: true } } },
      orderBy: { postedDate: "desc" },
      take: 50,
    }),
    db.resumeVersion.findMany({
      where: { resume: { userId: session.id }, isActive: true },
      select: { id: true, versionNumber: true, targetRole: true },
    }),
    db.company.findMany({
      where: { publication: "PUBLISHED" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 50,
    }),
  ]);

  return (
    <NewApplicationClient
      userId={session.id}
      opportunities={opportunities}
      resumeVersions={resumeVersions}
      companies={companies}
    />
  );
}