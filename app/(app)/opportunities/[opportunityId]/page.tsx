import { getCurrent } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { OpportunityDetailClient } from "@/components/opportunities/opportunity-detail-client";

export async function generateMetadata({ params }: { params: Promise<{ opportunityId: string }> }) {
  const { opportunityId } = await params;
  const opportunity = await db.careerOpportunity.findUnique({
    where: { id: opportunityId },
    select: { title: true },
  });
  if (!opportunity) return { title: "Opportunity not found" };
  return { title: opportunity.title };
}

export default async function OpportunityPage({ params }: { params: Promise<{ opportunityId: string }> }) {
  const { session } = await getCurrent();
  if (!session) redirect("/sign-in?next=/opportunities");

  const { opportunityId } = await params;

  const opportunity = await db.careerOpportunity.findUnique({
    where: { id: opportunityId },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          industry: true,
          description: true,
          headquarters: true,
          careersUrl: true,
          website: true,
        },
      },
      source: { select: { id: true, name: true, url: true, type: true } },
      _count: { select: { savedBy: true, applications: true } },
    },
  });

  if (!opportunity) notFound();

  const clientOpportunity = {
    ...opportunity,
    applicationDeadline: opportunity.applicationDeadline?.toISOString() ?? null,
    postedDate: opportunity.postedDate.toISOString(),
    lastVerifiedDate: opportunity.lastVerifiedDate?.toISOString() ?? null,
    createdAt: opportunity.createdAt.toISOString(),
    updatedAt: opportunity.updatedAt.toISOString(),
  };

  return (
    <OpportunityDetailClient
      opportunity={clientOpportunity}
      userId={session.id}
    />
  );
}