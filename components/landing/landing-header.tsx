"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Logo } from "@/components/ui/misc";

const LINKS = [
  ["#features", "Features"],
  ["#how", "How It Works"],
  ["#students", "For Students"],
  ["#professionals", "For Professionals"],
  ["#faq", "FAQ"],
] as const;

export function LandingHeader({ dashboardHref }: { dashboardHref?: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const s = document.getElementById("lp-sentinel");
    if (!s || !("IntersectionObserver" in window)) return; // header simply stays transparent
    const io = new IntersectionObserver(([e]) => setScrolled(!e!.isIntersecting));
    io.observe(s);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const cta = dashboardHref ? (
    <Link className="btn" href={dashboardHref}>
      Open dashboard
    </Link>
  ) : (
    <>
      <Link className="btn o lp-signin" href="/sign-in">
        Sign In
      </Link>
      <Link className="btn" href="/sign-up">
        Get Started
      </Link>
    </>
  );

  return (
    <>
      <header className={`lp-head${scrolled ? " scrolled" : ""}`}>
        <div className="lp-page lp-bar">
          <Link href="/" aria-label="Home">
            <Logo />
          </Link>
          <nav className="lp-links" aria-label="Main">
            {LINKS.map(([h, l]) => (
              <a key={h} href={h}>
                {l}
              </a>
            ))}
          </nav>
          <div className="lp-tools">
            {cta}
            <ThemeToggle />
            <button
              className="ib burger"
              aria-expanded={open}
              aria-controls="lp-overlay"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((o) => !o)}
            >
              <i />
              <i />
            </button>
          </div>
        </div>
      </header>
      <nav id="lp-overlay" className={`lp-overlay${open ? " open" : ""}`} aria-label="Menu">
        {LINKS.map(([h, l]) => (
          <a key={h} href={h} onClick={() => setOpen(false)}>
            {l}
          </a>
        ))}
        {!dashboardHref && (
          <Link href="/sign-in" onClick={() => setOpen(false)}>
            Sign In
          </Link>
        )}
      </nav>
    </>
  );
}
