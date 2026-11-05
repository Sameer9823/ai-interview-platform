import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { PrivateLayout } from "@/components/layout/private-layout";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s | Administration" },
  robots: { index: false, follow: false },
};

/** The only gate for the whole /admin tree. Anyone who is not an administrator is redirected before anything renders. */
export default async function Layout({ children }: { children: ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <PrivateLayout user={user}>
      <h1 style={{ marginBottom: 16 }}>Administration</h1>
      <AdminNav />
      {children}
    </PrivateLayout>
  );
}
