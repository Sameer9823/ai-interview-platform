"use client";

export function ThemeToggle() {
  return (
    <button
      className="ib"
      aria-label="Toggle theme"
      onClick={() => {
        const root = document.documentElement;
        const next = root.dataset.theme === "dark" ? "light" : "dark";
        root.dataset.theme = next;
        document.cookie = `ip-theme=${next}; path=/; max-age=31536000; samesite=lax`;
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M12 4a8 8 0 0 1 0 16z" />
      </svg>
    </button>
  );
}
