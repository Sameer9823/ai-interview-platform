import "server-only";
import { redirect } from "next/navigation";
import { authorizeRoute } from "@/lib/permissions";
import { getCurrent } from "./session";

/** Applies the route rules from lib/permissions. Returns the user record (or null on public and auth pages). */
export async function guard(path: string): Promise<Awaited<ReturnType<typeof getCurrent>>["record"]> {
  const { record, session } = await getCurrent();
  const decision = authorizeRoute(path, session);
  if (!decision.allowed) redirect(decision.redirectTo);
  return record;
}

export async function requireUser(path: string): Promise<NonNullable<Awaited<ReturnType<typeof getCurrent>>["record"]>> {
  const record = await guard(path);
  if (!record) redirect("/sign-in");
  return record;
}
