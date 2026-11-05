import type { ReactNode } from "react";
import { AppShell } from "./app-shell";
import type { DevUser } from "@/lib/data/dev-store";

export function PrivateLayout({ user, children }: { user: DevUser; children: ReactNode }) {
  // Private routes are only reachable after onboarding, so the stage is always set here.
  return (
    <AppShell stage={user.careerStage!} notifications={user.notifications} isAdmin={user.platformRole === "ADMIN"}>
      {children}
    </AppShell>
  );
}
