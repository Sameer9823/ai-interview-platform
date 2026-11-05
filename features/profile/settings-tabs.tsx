"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  ["account", "Account"],
  ["preferences", "Preferences"],
  ["security", "Security"],
] as const;

export function SettingsTabs() {
  const path = usePathname();
  return (
    <nav className="tabs" aria-label="Settings">
      {TABS.map(([slug, label]) => {
        const active = path === `/settings/${slug}`;
        return (
          <Link key={slug} href={`/settings/${slug}`} className="tab" aria-current={active ? "page" : undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
