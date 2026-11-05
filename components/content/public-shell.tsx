import "@/app/landing.css";
import Link from "next/link";
import type { ReactNode } from "react";
import { LandingFooter } from "@/components/landing/landing-footer";
import { Logo } from "@/components/ui/misc";
import { getCurrent } from "@/lib/auth/session";
import { dashboardFor } from "@/lib/permissions";

/** Header and footer for the public content pages. Published content is visible to everyone. */
export async function PublicShell({ children }: { children: ReactNode }) {
  const { record } = await getCurrent();
  const home = record ? (record.onboardingDone && record.careerStage ? dashboardFor(record.careerStage) : "/onboarding") : null;
  return (
    <div className="lp">
      <header className="lp-head scrolled">
        <div className="lp-page lp-bar">
          <Link href="/" aria-label="Home">
            <Logo />
          </Link>
          <nav className="pubnav" aria-label="Content">
            <Link href="/companies">Companies</Link>
            <Link href="/questions">Questions</Link>
            <Link href="/interview-experiences">Interview experiences</Link>
            <Link href="/topics/technical">Topics</Link>
            {record && <Link href="/saved">Saved</Link>}
          </nav>
          {home ? (
            <Link className="btn s" href={home}>
              Dashboard
            </Link>
          ) : (
            <Link className="btn s" href="/sign-in">
              Sign in
            </Link>
          )}
        </div>
      </header>
      <main id="main" className="pub">
        {children}
      </main>
      <LandingFooter />
    </div>
  );
}
