"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ThemeToggle } from "./theme-toggle";
import { NotificationMenu, type NotificationItem } from "@/features/notifications/notification-menu";
import { signOutAction } from "@/features/auth/actions";
import { Logo } from "@/components/ui/misc";
import { CAREER_STAGE_LABELS } from "@/lib/utils/labels";

interface Props {
  stage: "STUDENT" | "FRESHER" | "PROFESSIONAL";
  notifications: NotificationItem[];
  isAdmin?: boolean;
  children: ReactNode;
}

// Simple 24px outline icons, drawn for this project. Each shape sets its own fill and stroke.
const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function AppShell({ stage, notifications, isAdmin, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const path = usePathname();
  const dash = stage === "PROFESSIONAL" ? "/professional/dashboard" : "/student/dashboard";
  const items = [
    { href: dash, label: "Overview", icon: "i-home" },
    { href: "/profile", label: "My Profile", icon: "i-user" },
    { href: "/goals", label: "Preparation Goals", icon: "i-target" },
    { href: "/library", label: "Preparation Library", icon: "i-book" },
    { href: "/saved", label: "Saved Questions", icon: "i-check" },
    { href: "/assessments", label: "Assessments", icon: "i-check", soon: true },
    { href: "/mock-interviews", label: "AI Mock Interviews", icon: "i-mic", soon: true },
    { href: "/resume", label: "Resume Analysis", icon: "i-file", soon: true },
    { href: "/settings/account", label: "Settings", icon: "i-cog" },
    ...(isAdmin ? [{ href: "/admin", label: "Administration", icon: "i-cog" }] : []),
  ];
  const current = (href: string) =>
    href.startsWith("/settings")
      ? path.startsWith("/settings")
      : href === "/library"
        ? path === "/library"
        : path === href || (href === "/admin" && path.startsWith("/admin"));

  return (
    <div className={`shell${collapsed ? " c" : ""}${navOpen ? " nav-open" : ""}`}>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <symbol id="i-home" viewBox="0 0 24 24">
          <path {...S} d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />
        </symbol>
        <symbol id="i-user" viewBox="0 0 24 24">
          <circle {...S} cx="12" cy="8" r="4" />
          <path {...S} d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
        </symbol>
        <symbol id="i-target" viewBox="0 0 24 24">
          <circle {...S} cx="12" cy="12" r="9" />
          <circle {...S} cx="12" cy="12" r="5" />
          <circle {...S} cx="12" cy="12" r="1" />
        </symbol>
        <symbol id="i-book" viewBox="0 0 24 24">
          <path {...S} d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
          <path {...S} d="M5 17a3 3 0 0 1 3-3h11" />
        </symbol>
        <symbol id="i-check" viewBox="0 0 24 24">
          <rect {...S} x="5" y="4" width="14" height="17" rx="2" />
          <path {...S} d="M9 12l2 2 4-4" />
        </symbol>
        <symbol id="i-mic" viewBox="0 0 24 24">
          <rect {...S} x="9" y="3" width="6" height="11" rx="3" />
          <path {...S} d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </symbol>
        <symbol id="i-file" viewBox="0 0 24 24">
          <path {...S} d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          <path {...S} d="M14 3v5h5M9 13h6M9 17h6" />
        </symbol>
        <symbol id="i-cog" viewBox="0 0 24 24">
          <path {...S} d="M4 8h9M17 8h3M4 16h3M11 16h9" />
          <circle {...S} cx="15" cy="8" r="2" />
          <circle {...S} cx="9" cy="16" r="2" />
        </symbol>
        <symbol id="bell" viewBox="0 0 256 256">
          <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216Z" />
        </symbol>
        <symbol id="menu" viewBox="0 0 256 256">
          <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z" />
        </symbol>
      </svg>
      {navOpen && <div className="scrim" onClick={() => setNavOpen(false)} />}
      <aside className="side" aria-label="Sidebar">
        <Logo />
        <nav className="nav" aria-label="Main">
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              aria-current={current(i.href) ? "page" : undefined}
              title={collapsed ? i.label : undefined}
              onClick={() => setNavOpen(false)}
            >
              <svg aria-hidden="true">
                <use href={`#${i.icon}`} />
              </svg>
              <span className="lbl">
                {i.label}
                {i.soon && <span className="soon">Soon</span>}
              </span>
            </Link>
          ))}
        </nav>
        <form action={signOutAction} style={{ marginTop: "auto" }}>
          <button className="btn o s" style={{ width: "100%" }} type="submit">
            Sign out
          </button>
        </form>
      </aside>
      <div>
        <header className="top">
          <button
            className="ib"
            aria-label="Toggle sidebar"
            aria-expanded={navOpen || !collapsed}
            onClick={() => (window.innerWidth < 768 ? setNavOpen((o) => !o) : setCollapsed((c) => !c))}
          >
            <svg aria-hidden="true">
              <use href="#menu" />
            </svg>
          </button>
          <div className="tools">
            <span className="sm mut stage">{CAREER_STAGE_LABELS[stage]}</span>
            <NotificationMenu items={notifications} />
            <ThemeToggle />
          </div>
        </header>
        <main className="main fade" id="main">
          {children}
        </main>
      </div>
    </div>
  );
}
