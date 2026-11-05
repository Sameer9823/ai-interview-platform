"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  ["/admin", "Overview"],
  ["/admin/companies", "Companies"],
  ["/admin/questions", "Questions"],
  ["/admin/experiences", "Experiences"],
  ["/admin/categories", "Categories and tags"],
  ["/admin/sources", "Sources"],
  ["/admin/imports", "Imports"],
  ["/admin/review", "Review queue"],
  ["/admin/audit", "Audit log"],
] as const;
export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="adminnav" aria-label="Administration">
      {ITEMS.map(([href, label]) => {
        const on = href === "/admin" ? path === href : path.startsWith(href);
        return (
          <Link key={href} href={href} className="tab" aria-current={on ? "page" : undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
