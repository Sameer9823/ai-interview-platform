import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/content/public-shell";
import { Pager } from "@/components/content/ui";
import { SelectField, TextField } from "@/components/ui/field";
import { Badge, EmptyState } from "@/components/ui/misc";
import { publishedCompanyOptions, searchExperiences } from "@/lib/content/search";
import { LABELS } from "@/lib/content/types";
import { experienceQuery } from "@/lib/content/validation";

export const metadata: Metadata = { title: "Interview experiences" };
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = experienceQuery.parse(Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])));
  const r = searchExperiences(q);
  return (
    <PublicShell>
      <h1>Interview experiences</h1>
      <p className="mut" style={{ marginTop: 8, maxWidth: "42.5rem" }}>
        Experiences reported by candidates or the community, kept with their source. They describe one person&apos;s process. They are not
        confirmed by the company and are not official.
      </p>
      <form method="get" className="filters" role="search" aria-label="Filter experiences">
        <TextField id="q" label="Search" type="search" defaultValue={q.q} maxLength={100} />
        <div className="field">
          <label htmlFor="company">Company</label>
          <select id="company" name="company" defaultValue={q.company ?? ""}>
            <option value="">Any company</option>
            {publishedCompanyOptions().map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <SelectField id="level" label="Experience level" options={LABELS.level} defaultValue={q.level ?? ""} />
        <SelectField id="stage" label="Career stage" options={LABELS.careerStage} defaultValue={q.stage ?? ""} />
        <div className="row">
          <button className="btn" type="submit">
            Apply
          </button>
          <Link className="btn o" href="/interview-experiences">
            Clear
          </Link>
        </div>
      </form>
      <div className="grid g2" style={{ marginTop: 24 }}>
        {r.items.map((e) => (
          <Link key={e.slug} href={`/interview-experiences/${e.slug}`} className="card h qcard">
            <h3>
              {e.company?.name}: {e.role}
            </h3>
            <p className="sm mut">{e.summary}</p>
            <div className="meta">
              <Badge>{e.originLabel}</Badge>
              <Badge>{e.verificationLabel}</Badge>
              {e.level && <Badge>{e.level}</Badge>}
              {e.reportedYear && <Badge>{String(e.reportedYear)}</Badge>}
            </div>
          </Link>
        ))}
      </div>
      {r.items.length === 0 && (
        <EmptyState>
          No interview experiences have been published yet. Nothing here is invented, so this list stays empty until real, sourced
          experiences are reviewed and approved.
        </EmptyState>
      )}
      <Pager
        basePath="/interview-experiences"
        params={{ q: q.q, company: q.company, level: q.level, stage: q.stage }}
        page={r.page}
        totalPages={r.totalPages}
        total={r.total}
      />
    </PublicShell>
  );
}
