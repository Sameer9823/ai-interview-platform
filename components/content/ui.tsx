import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/misc";
import type { PublicSource } from "@/lib/content/dto";

export function Provenance({
  originLabel,
  originNote,
  verificationLabel,
  lastLabel,
}: {
  originLabel: string;
  originNote: string;
  verificationLabel: string;
  lastLabel?: string;
}) {
  return (
    <div className="prov" role="note">
      <b>{originLabel}</b> · {verificationLabel}
      {lastLabel ? ` · ${lastLabel}` : ""}
      <p>{originNote}</p>
    </div>
  );
}

export function SourceList({ sources }: { sources: PublicSource[] }) {
  if (!sources.length) return <p className="sm mut">No sources are listed.</p>;
  return (
    <ul className="l">
      {sources.map((s) => (
        <li key={s.title + s.domain} style={{ display: "block" }}>
          {s.url ? (
            <a className="lk" href={s.url} target="_blank" rel="noopener noreferrer nofollow">
              {s.title}
            </a>
          ) : (
            <span>{s.title}</span>
          )}
          <span className="sm mut">
            {" "}
            · {s.typeLabel}
            {s.publisher ? ` · ${s.publisher}` : ""}
            {s.url ? ` · ${s.domain}` : ""}
          </span>
          {s.attribution && <span className="sm mut"> · Attribution: {s.attribution}</span>}
        </li>
      ))}
    </ul>
  );
}

export function Pager({
  basePath,
  params,
  page,
  totalPages,
  total,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  totalPages: number;
  total: number;
}) {
  const href = (p: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) u.set(k, v);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  return (
    <nav className="pager" aria-label="Pagination">
      <Link
        className="btn o s"
        href={href(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        tabIndex={page <= 1 ? -1 : undefined}
        rel="prev"
      >
        Previous
      </Link>
      <span className="sm mut" aria-live="polite">
        Page {page} of {totalPages} · {total} {total === 1 ? "result" : "results"}
      </span>
      <Link
        className="btn o s"
        href={href(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        tabIndex={page >= totalPages ? -1 : undefined}
        rel="next"
      >
        Next
      </Link>
    </nav>
  );
}

export function QuestionCard({
  q,
}: {
  q: {
    slug: string;
    text: string;
    category: { slug: string; name: string } | null;
    typeLabel: string;
    difficultyLabel: string;
    estimatedMinutes: number;
    skills: string[];
    companies: { slug: string; name: string }[];
    originLabel: string;
    verificationLabel: string;
    publication?: string;
  };
}) {
  return (
    <Link href={`/questions/${q.slug}`} className="card h qcard">
      <h3>{q.text}</h3>
      <div className="meta">
        <Badge>{q.difficultyLabel}</Badge>
        <Badge>{q.typeLabel}</Badge>
        <Badge>{q.estimatedMinutes} min</Badge>
        {q.category && <Badge>{q.category.name}</Badge>}
      </div>
      <p className="sm mut" style={{ marginTop: 12 }}>
        {q.originLabel} · {q.verificationLabel}
        {q.companies.length ? ` · Linked to ${q.companies.map((c) => c.name).join(", ")}` : ""}
      </p>
      {q.publication && q.publication !== "PUBLISHED" && (
        <p className="sm" style={{ marginTop: 8 }}>
          <Badge>{q.publication.toLowerCase().replace("_", " ")}: preview only</Badge>
        </p>
      )}
    </Link>
  );
}

export const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="sect">
    <h2>{title}</h2>
    <div style={{ marginTop: 12 }}>{children}</div>
  </section>
);
export const Crumbs = ({ items }: { items: { href?: string; label: string }[] }) => (
  <nav className="crumbs" aria-label="Breadcrumb">
    {items.map((i, n) => (
      <span key={i.label}>
        {n > 0 && " / "}
        {i.href ? <Link href={i.href}>{i.label}</Link> : i.label}
      </span>
    ))}
  </nav>
);
