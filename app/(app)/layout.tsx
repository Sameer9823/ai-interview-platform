import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/guard";
import { PrivateLayout } from "@/components/layout/private-layout";

// Every shared private page (/profile, /goals, /library, /settings ...) allows any onboarded user.
export default async function Layout({ children }: { children: ReactNode }) {
  const user = await requireUser("/profile");
  return <PrivateLayout user={user}>{children}</PrivateLayout>;
}
