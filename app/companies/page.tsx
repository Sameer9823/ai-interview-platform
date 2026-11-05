import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/content/public-shell";
import { Pager } from "@/components/content/ui";
import { SelectField, TextField } from "@/components/ui/field";
import { Badge, Card, EmptyState } from "@/components/ui/misc";
import { industries, searchCompanies } from "@/lib/content/search";
import { companyQuery } from "@/lib/content/validation";

export const metadata: Metadata = {
  title: "Companies",
  description: "Company profiles with links to official careers pages and source labeled preparation content.",
};
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = companyQuery.parse(Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])));
  const r = searchCompanies(q);
  const inds = Object.fromEntries(industries().map((i) => [i, i]));
  return (
    <PublicShell>
      <h1>Companies</h1>
      <p className="mut" style={{ marginTop: 8, maxWidth: "42.5rem" }}>
        Companies here are reference entries for interview preparation. They are not employers on this platform. Details are only as
        verified as the labels say.
      </p>
      <form method="get" className="filters" role="search" aria-label="Filter companies">
        <TextField id="q" label="Search" type="search" defaultValue={q.q} maxLength={100} />
        <SelectField id="industry" label="Industry" options={inds} defaultValue={q.industry ?? ""} />
        <TextField id="role" label="Role category" defaultValue={q.role ?? ""} maxLength={80} />
        <div className="row">
          <button className="btn" type="submit">
            Apply
          </button>
          <Link className="btn o" href="/companies">
            Clear
          </Link>
        </div>
      </form>
      <div className="grid g3" style={{ marginTop: 24 }}>
        {r.items.map((c) => (
          <Link key={c.slug} href={`/companies/${c.slug}`} className="card h qcard">
            <h3>{c.name}</h3>
            <p className="sm mut">{c.industry}</p>
            <div className="meta">
              <Badge>{c.verificationLabel}</Badge>
            </div>
            <p className="sm mut" style={{ marginTop: 12 }}>
              {c.counts.questions} linked {c.counts.questions === 1 ? "question" : "questions"} · {c.counts.experiences}{" "}
              {c.counts.experiences === 1 ? "experience" : "experiences"} · {c.counts.processes} process{" "}
              {c.counts.processes === 1 ? "record" : "records"}
            </p>
          </Link>
        ))}
      </div>
      {r.items.length === 0 && <EmptyState>No companies match. Try a different search.</EmptyState>}
      <Pager
        basePath="/companies"
        params={{ q: q.q, industry: q.industry, role: q.role }}
        page={r.page}
        totalPages={r.totalPages}
        total={r.total}
      />
      <Card style={{ marginTop: 32 }}>
        <p className="sm mut">
          Counts include only published content that is linked to the company by a supporting source. A count of zero means nothing has been
          published yet, not that the company has no interviews.
        </p>
      </Card>
    </PublicShell>
  );
}
