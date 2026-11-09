import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { RecommendedOpportunitiesClient } from "@/components/opportunities/recommended-opportunities-client";

export default async function RecommendedOpportunitiesPage() {
  const { session } = await getCurrent();
  if (!session) redirect("/sign-in?next=/opportunities/recommended");

  return <RecommendedOpportunitiesClient userId={session.id} />;
}