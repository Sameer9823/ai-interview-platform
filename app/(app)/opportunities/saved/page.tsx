import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { SavedOpportunitiesClient } from "@/components/opportunities/saved-opportunities-client";

export default async function SavedOpportunitiesPage() {
  const { session } = await getCurrent();
  if (!session) redirect("/sign-in?next=/opportunities/saved");

  return <SavedOpportunitiesClient userId={session.id} />;
}