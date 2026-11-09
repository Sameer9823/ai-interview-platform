import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { CareerSearchSettingsClient } from "@/components/opportunities/career-search-settings-client";

export default async function CareerSearchSettingsPage() {
  const { session } = await getCurrent();
  if (!session) redirect("/sign-in?next=/career-search/settings");

  return <CareerSearchSettingsClient userId={session.id} />;
}