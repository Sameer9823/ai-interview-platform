import "@/app/landing.css";
import Link from "next/link";
import type { ReactNode } from "react";
import { LandingFooter } from "./landing-footer";
import { Logo } from "@/components/ui/misc";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="lp">
      <header className="lp-head scrolled">
        <div className="lp-page lp-bar">
          <Link href="/" aria-label="Home">
            <Logo />
          </Link>
          <Link className="btn o s" href="/">
            Back to home
          </Link>
        </div>
      </header>
      <main id="main" className="lp-legal">
        <h1 style={{ fontSize: "2.25rem", lineHeight: "2.5rem" }}>{title}</h1>
        <p className="lp-draft">
          <strong>Draft.</strong> This text is an editable starting point, not legal advice. Have it reviewed before launch.
        </p>
        {children}
      </main>
      <LandingFooter />
    </div>
  );
}
