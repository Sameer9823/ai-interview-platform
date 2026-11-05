import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { OpportunityClient } from "@/components/opportunities/opportunity-client";

export default async function OpportunitiesPage() {
  const { session } = await getCurrent();
  if (!session) redirect("/sign-in?next=/opportunities");

  return <OpportunityClient userId={session.id} />;
}