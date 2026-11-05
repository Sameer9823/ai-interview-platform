import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/content/public-shell";
import { Crumbs, Provenance, Section, SourceList } from "@/components/content/ui";
import { Badge } from "@/components/ui/misc";
import { getCurrent } from "@/lib/auth/session";
import { getExperience } from "@/lib/content/search";

type P = { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const e = getExperience((await params).slug);
  return { title: e ? `${e.company?.name}: ${e.role}` : "Interview experience" };
}

export default async function Page({ params, searchParams }: P) {
  const { slug } = await params,
    { preview } = await searchParams,
    { record } = await getCurrent();
  const previewing = preview === "1" && record?.platformRole === "ADMIN";
  const e = getExperience(slug, { includeUnpublished: previewing });
  if (!e) notFound();
  return (
    <PublicShell>
      {previewing && e.publication !== "PUBLISHED" && (
        <p className="banner" role="status">
          Preview. This experience is not published and is not visible to the public.
        </p>
      )}
      <Crumbs items={[{ href: "/interview-experiences", label: "Interview experiences" }, { label: e.role }]} />
      <h1 style={{ fontSize: "1.875rem", lineHeight: "2.25rem" }}>
        {e.company ? <Link href={`/companies/${e.company.slug}`}>{e.company.name}</Link> : null}: {e.role}
      </h1>
      <div className="meta">
        {e.careerStage && <Badge>{e.careerStage}</Badge>}
        {e.level && <Badge>{e.level}</Badge>}
        {e.reportedYear && <Badge>Reported {e.reportedYear}</Badge>}
      </div>
      <Provenance
        originLabel={e.originLabel}
        originNote={e.originNote}
        verificationLabel={e.verificationLabel}
        lastLabel={e.lastReviewedAt ? `Reviewed ${e.lastReviewedAt.slice(0, 10)}` : "Not yet reviewed"}
      />
      <Section title="Summary">
        <p style={{ whiteSpace: "pre-wrap" }}>{e.summary}</p>
      </Section>
      {e.rounds.length > 0 && (
        <Section title="Rounds described by the contributor">
          <ol className="stack" style={{ paddingLeft: 20 }}>
            {e.rounds.map((r) => (
              <li key={r.title}>
                <b>{r.title}</b>
                {r.description ? `: ${r.description}` : ""}
              </li>
            ))}
          </ol>
        </Section>
      )}
      {e.topics.length > 0 && (
        <Section title="Topics reportedly covered">
          <div className="meta">
            {e.topics.map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
        </Section>
      )}
      {e.reportedQuestions.length > 0 && (
        <Section title="Questions the candidate reported">
          <p className="sm mut">Summarised in other words. Wording may differ from the original and the company has not confirmed them.</p>
          <ul className="l" style={{ marginTop: 8 }}>
            {e.reportedQuestions.map((x) => (
              <li key={x} style={{ display: "block" }}>
                {x}
              </li>
            ))}
          </ul>
        </Section>
      )}
      {e.advice && (
        <Section title="Preparation advice from the candidate">
          <p style={{ whiteSpace: "pre-wrap" }}>{e.advice}</p>
        </Section>
      )}
      <Section title="Where this came from">
        <ul className="l">
          {e.sourceUrl && (
            <li style={{ display: "block" }}>
              <a className="lk" href={e.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">
                Original source
              </a>
            </li>
          )}
          {e.sourceRef && <li style={{ display: "block" }}>Reference: {e.sourceRef}</li>}
        </ul>
        <div style={{ marginTop: 12 }}>
          <SourceList sources={e.sources} />
        </div>
      </Section>
    </PublicShell>
  );
}
