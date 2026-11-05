import type { ReactNode } from "react";
import { SettingsTabs } from "@/features/profile/settings-tabs";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <h1>Settings</h1>
      <SettingsTabs />
      {children}
    </>
  );
}
