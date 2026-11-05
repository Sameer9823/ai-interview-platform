import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guard";
import { PreferencesForm } from "@/features/profile/profile-forms";

export const metadata: Metadata = { title: "Preferences" };
export default async function Page() {
  return <PreferencesForm prefs={(await requireUser("/settings/preferences")).prefs} />;
}
