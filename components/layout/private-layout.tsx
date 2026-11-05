import type { ReactNode } from "react";
import { AppShell } from "./app-shell";
import type { CurrentUser } from "@/lib/auth/types";

export function PrivateLayout({ user, children }: { user: CurrentUser; children: ReactNode }) {
  // Private routes are only reachable after onboarding, so the stage is always set here.
  return (
    <AppShell stage={user.careerStage!} notifications={user.notifications} isAdmin={user.platformRole === "ADMIN"}>
      {children}
    </AppShell>
  );
}
