import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ApplicationsClient } from "@/components/applications/applications-client";

export default async function ApplicationsPage() {
  const { session } = await getCurrent();
  if (!session) redirect("/sign-in?next=/applications");

  return <ApplicationsClient userId={session.id} />;
}