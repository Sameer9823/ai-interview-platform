import "server-only";
import { redirect } from "next/navigation";
import { requireUser } from "./guard";
import { dashboardFor } from "@/lib/permissions";
import type { Actor } from "@/lib/content/service";

/** Server side admin check. The role is read from the stored account, never from the browser. Every admin page and action calls this. */
export async function requireAdmin(): Promise<{ user: Awaited<ReturnType<typeof requireUser>>; actor: Actor }> {
  const user = await requireUser("/admin");
  if (user.platformRole !== "ADMIN") redirect(user.careerStage ? dashboardFor(user.careerStage) : "/onboarding");
  return { user, actor: { id: user.id, platformRole: "ADMIN" } };
}
