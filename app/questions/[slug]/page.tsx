import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/content/public-shell";
import { SaveButton } from "@/components/content/save-button";
import { Crumbs, Provenance, QuestionCard, Section, SourceList } from "@/components/content/ui";
import { Badge } from "@/components/ui/misc";
import { getCurrent } from "@/lib/auth/session";
import { getQuestion, isSaved } from "@/lib/content/search";

type P = { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const r = getQuestion(slug);
  return { title: r ? r.question.text.slice(0, 70) : "Question" };
}

export default async function Page({ params, searchParams }: P) {
  const { slug } = await params,
    { preview } = await searchParams,
    { record } = await getCurrent();
  const previewing = preview === "1" && record?.platformRole === "ADMIN";
  const r = getQuestion(slug, { includeUnpublished: previewing });
  if (!r) notFound();
  const { question: q, related, id } = r;
  return (
    <PublicShell>
      {previewing && q.publication !== "PUBLISHED" && (
        <p className="banner" role="status">
          Preview. This question is {q.publication.toLowerCase().replace("_", " ")} and is not visible to the public.
        </p>
      )}
      <Crumbs
        items={[
          { href: "/questions", label: "Questions" },
          ...q.path.map((p) => ({ href: `/topics/${p.slug}`, label: p.name })),
          { label: "This question" },
        ]}
      />
      <h1 style={{ fontSize: "1.875rem", lineHeight: "2.25rem", maxWidth: "48rem" }}>{q.text}</h1>
      <div className="meta">
        <Badge>{q.difficultyLabel}</Badge>
        <Badge>{q.typeLabel}</Badge>
        <Badge>About {q.estimatedMinutes} min</Badge>
      </div>
      <Provenance originLabel={q.originLabel} originNote={q.originNote} verificationLabel={q.verificationLabel} />
      <div className="row">
        <SaveButton questionId={id} saved={record ? isSaved(record.id, id) : false} back={`/questions/${q.slug}`} />
        {!record && <span className="sm mut">Sign in to save questions.</span>}
      </div>

      <Section title="About this question">
        <ul className="l">
          {q.companies.length > 0 && (
            <li style={{ display: "block" }}>
              <span className="mut">Linked companies </span>
              {q.companies.map((c, i) => (
                <span key={c.slug}>
                  {i > 0 && ", "}
                  <Link className="lk" href={`/companies/${c.slug}`}>
                    {c.name}
                  </Link>
                </span>
              ))}
              <span className="sm mut"> (supported by the sources below)</span>
            </li>
          )}
          {q.roles.length > 0 && (
            <li>
              <span className="mut">Roles</span>
              <span>{q.roles.join(", ")}</span>
            </li>
          )}
          {q.careerStages.length > 0 && (
            <li>
              <span className="mut">Career stage</span>
              <span>{q.careerStages.join(", ")}</span>
            </li>
          )}
          {q.experienceLevels.length > 0 && (
            <li>
              <span className="mut">Experience level</span>
              <span>{q.experienceLevels.join(", ")}</span>
            </li>
          )}
          {q.skills.length > 0 && (
            <li>
              <span className="mut">Skills</span>
              <span>{q.skills.join(", ")}</span>
            </li>
          )}
        </ul>
      </Section>

      {q.type === "MULTIPLE_CHOICE" && q.options.length > 0 && (
        <Section title="Options">
          <ol className="stack" style={{ paddingLeft: 20 }}>
            {q.options.map((o) => (
              <li key={o.text}>{o.text}</li>
            ))}
          </ol>
          <details className="ans">
            <summary>Show the correct answer</summary>
            <p style={{ marginTop: 8 }}>
              {q.options
                .filter((o) => o.correct)
                .map((o) => o.text)
                .join(", ")}
            </p>
          </details>
        </Section>
      )}
      {q.hints.length > 0 && (
        <Section title="Hints">
          <details className="ans">
            <summary>
              Show {q.hints.length} {q.hints.length === 1 ? "hint" : "hints"}
            </summary>
            <ol style={{ paddingLeft: 20, marginTop: 8 }}>
              {q.hints.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ol>
          </details>
        </Section>
      )}

      <Section title="Answer outline">
        <p className="sm mut">A short outline of a strong answer. It is not the only valid way to answer.</p>
        <details className="ans">
          <summary>Show the answer outline</summary>
          <p style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{q.answerOutline}</p>
        </details>
      </Section>
      {q.explanation && (
        <Section title="Explanation">
          <details className="ans">
            <summary>Show the explanation</summary>
            <p style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{q.explanation}</p>
          </details>
        </Section>
      )}
      {q.exampleAnswer && (
        <Section title="Sample answer">
          <p className="sm mut">One possible answer. Not a definitive answer.</p>
          <details className="ans">
            <summary>Show the sample answer</summary>
            <p style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{q.exampleAnswer}</p>
          </details>
        </Section>
      )}
      {q.codeSolution && (
        <Section title={`Code solution${q.codeLanguage ? ` (${q.codeLanguage})` : ""}`}>
          <details className="ans">
            <summary>Show the solution</summary>
            <pre className="code">
              <code>{q.codeSolution}</code>
            </pre>
          </details>
          {q.testCases.length > 0 && (
            <>
              <h3 style={{ marginTop: 16, fontSize: "1rem" }}>Test cases</h3>
              <ul className="l" style={{ marginTop: 8 }}>
                {q.testCases.map((t) => (
                  <li key={t.input + t.expected}>
                    <code>{t.input}</code>
                    <span>
                      expected <code>{t.expected}</code>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Section>
      )}

      <Section title="Sources">
        <SourceList sources={q.sources} />
        <p className="sm mut" style={{ marginTop: 12 }}>
          Last updated {new Date(q.updatedAt).toISOString().slice(0, 10)}.
        </p>
      </Section>
      {related.length > 0 && (
        <Section title="Related questions">
          <div className="grid g2" style={{ marginTop: 0 }}>
            {related.map((x) => (
              <QuestionCard key={x.slug} q={x} />
            ))}
          </div>
        </Section>
      )}
    </PublicShell>
  );
}
