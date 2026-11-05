"use client";
import { useEffect } from "react";

/** Scroll reveals and the tagline word reveal. Content stays fully visible without JavaScript or with reduced motion. */
export function LandingEffects() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const root = document.documentElement;
    root.classList.add("lp-js");
    const reveal = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            reveal.unobserve(e.target);
          }
        }),
      { threshold: 0.15 },
    );
    document.querySelectorAll(".lp .rv").forEach((n) => reveal.observe(n));
    const words = Array.from(document.querySelectorAll<HTMLElement>(".lp-tag .w"));
    const wio = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            el.style.transitionDelay = `${Math.min(words.indexOf(el) * 30, 450)}ms`;
            el.classList.add("on");
            wio.unobserve(el);
          }
        }),
      { rootMargin: "0px 0px -35% 0px" },
    );
    words.forEach((w) => wio.observe(w));
    return () => {
      root.classList.remove("lp-js");
      reveal.disconnect();
      wio.disconnect();
    };
  }, []);
  return null;
}
