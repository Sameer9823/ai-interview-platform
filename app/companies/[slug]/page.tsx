import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/content/public-shell";
import { Crumbs, Provenance, QuestionCard, Section, SourceList } from "@/components/content/ui";
import { Badge, Card, EmptyState } from "@/components/ui/misc";
import { getCurrent } from "@/lib/auth/session";
import { getCompany } from "@/lib/content/search";

type P = { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const r = getCompany((await params).slug);
  return { title: r ? r.company.name : "Company" };
}

export default async function Page({ params, searchParams }: P) {
  const { slug } = await params,
    { preview } = await searchParams,
    { record } = await getCurrent();
  const previewing = preview === "1" && record?.platformRole === "ADMIN";
  const r = getCompany(slug, { includeUnpublished: previewing });
  if (!r) notFound();
  const { company: c, processes, questions, experiences } = r;
  const official = processes.filter((p) => p.origin === "OFFICIAL"),
    reported = processes.filter((p) => p.origin !== "OFFICIAL");
  const Proc = ({ p }: { p: (typeof processes)[number] }) => (
    <Card>
      <h3>
        {p.sequence ? `${p.sequence}. ` : ""}
        {p.title}
      </h3>
      <div className="meta">
        <Badge>{p.kindLabel}</Badge>
        {p.roleFamily && <Badge>{p.roleFamily}</Badge>}
        {p.careerStages.map((s) => (
          <Badge key={s}>{s}</Badge>
        ))}
        {p.experienceLevels.map((s) => (
          <Badge key={s}>{s}</Badge>
        ))}
      </div>
      <p style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{p.description}</p>
      {p.skillsEvaluated.length > 0 && (
        <p className="sm mut" style={{ marginTop: 8 }}>
          Skills evaluated: {p.skillsEvaluated.join(", ")}
        </p>
      )}
      {p.prepRecommendations && (
        <p className="sm" style={{ marginTop: 8 }}>
          Preparation: {p.prepRecommendations}
        </p>
      )}
      <Provenance
        originLabel={p.originLabel}
        originNote={p.originNote}
        verificationLabel={p.verificationLabel}
        lastLabel={p.lastReviewedAt ? `Reviewed ${p.lastReviewedAt.slice(0, 10)}` : "Not yet reviewed"}
      />
      <details className="ans">
        <summary>Sources for this record</summary>
        <div style={{ marginTop: 8 }}>
          <SourceList sources={p.sources} />
        </div>
      </details>
    </Card>
  );
  return (
    <PublicShell>
      {previewing && c.publication !== "PUBLISHED" && (
        <p className="banner" role="status">
          Preview. This company is not published and is not visible to the public.
        </p>
      )}
      <Crumbs items={[{ href: "/companies", label: "Companies" }, { label: c.name }]} />
      <h1>{c.name}</h1>
      <p className="mut" style={{ marginTop: 8 }}>
        {c.industry}
        {c.headquarters ? ` · ${c.headquarters}` : ""}
      </p>
      <Provenance
        originLabel={c.originLabel}
        originNote={c.originNote}
        verificationLabel={c.verificationLabel}
        lastLabel={c.lastVerifiedAt ? `Last verified ${c.lastVerifiedAt.slice(0, 10)}` : "Last verified: never"}
      />

      <Section title="Overview">
        {c.description ? (
          <p style={{ whiteSpace: "pre-wrap" }}>{c.description}</p>
        ) : (
          <EmptyState>No verified overview has been published yet.</EmptyState>
        )}
      </Section>
      <Section title="Official links">
        <ul className="l">
          <li style={{ display: "block" }}>
            <a className="lk" href={c.careersUrl} target="_blank" rel="noopener noreferrer nofollow">
              Official careers page
            </a>
            <span className="sm mut"> · opens the company&apos;s own website</span>
          </li>
          <li style={{ display: "block" }}>
            <a className="lk" href={c.website} target="_blank" rel="noopener noreferrer nofollow">
              Company website
            </a>
          </li>
        </ul>
      </Section>
      {c.roleCategories.length > 0 && (
        <Section title="Role categories">
          <div className="meta">
            {c.roleCategories.map((x) => (
              <Badge key={x}>{x}</Badge>
            ))}
          </div>
        </Section>
      )}

      <Section title="Officially documented hiring information">
        {c.hiringInfo ? (
          <>
            <p style={{ whiteSpace: "pre-wrap" }}>{c.hiringInfo}</p>
            <p className="sm mut" style={{ marginTop: 8 }}>
              Taken from the official sources below.
            </p>
          </>
        ) : (
          <EmptyState>
            No verified information available yet. This company may not publish its interview process, and nothing has been inferred.
          </EmptyState>
        )}
        {official.length > 0 && (
          <div className="stack" style={{ marginTop: 16 }}>
            {official.map((p) => (
              <Proc key={p.id} p={p} />
            ))}
          </div>
        )}
      </Section>
      <Section title="Reported interview rounds">
        <p className="sm mut" style={{ marginBottom: 12 }}>
          Reported or curated by others. Not company policy. Candidates may follow different processes.
        </p>
        {reported.length > 0 ? (
          <div className="stack">
            {reported.map((p) => (
              <Proc key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <EmptyState>No reported interview rounds have been published yet.</EmptyState>
        )}
      </Section>
      {c.prepCategories.length > 0 && (
        <Section title="Preparation topics">
          <div className="meta">
            {c.prepCategories.map((x) => (
              <Link key={x.slug} className="btn o s" href={`/topics/${x.slug}`}>
                {x.name}
              </Link>
            ))}
          </div>
        </Section>
      )}
      <Section title="Practice questions linked to this company">
        <p className="sm mut" style={{ marginBottom: 12 }}>
          A question appears here only when a source supports the link. Original practice questions are never linked to a company.
        </p>
        {questions.length > 0 ? (
          <div className="grid g2" style={{ marginTop: 0 }}>
            {questions.map((x) => (
              <QuestionCard key={x.slug} q={x} />
            ))}
          </div>
        ) : (
          <EmptyState>
            No questions have been linked to {c.name} yet. <Link href="/questions">Browse general practice questions</Link>.
          </EmptyState>
        )}
      </Section>
      <Section title="Candidate reported experiences">
        {experiences.length > 0 ? (
          <ul className="l">
            {experiences.map((e) => (
              <li key={e.slug} style={{ display: "block" }}>
                <Link className="lk" href={`/interview-experiences/${e.slug}`}>
                  {e.role}
                  {e.reportedYear ? ` (${e.reportedYear})` : ""}
                </Link>
                <span className="sm mut">
                  {" "}
                  · {e.originLabel} · {e.verificationLabel}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>No interview experiences have been published for {c.name}.</EmptyState>
        )}
      </Section>
      <Section title="Sources">
        <SourceList sources={c.sources} />
      </Section>
    </PublicShell>
  );
}
