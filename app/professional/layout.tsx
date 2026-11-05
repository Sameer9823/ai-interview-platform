import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/guard";
import { PrivateLayout } from "@/components/layout/private-layout";

export default async function Layout({ children }: { children: ReactNode }) {
  const user = await requireUser("/professional/dashboard");
  return <PrivateLayout user={user}>{children}</PrivateLayout>;
}
