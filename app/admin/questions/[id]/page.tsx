import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfigForm } from "@/components/admin/config-form";
import { questionDefaults, questionFields } from "@/components/admin/fields";
import { Flash, Revisions, StatusPanel, first } from "@/components/admin/ui";
import { saveQuestionAction } from "@/features/admin/actions";
import { requireAdmin } from "@/lib/auth/admin";
import { findDuplicateQuestions, getEntity, revisionsFor } from "@/lib/content/service";
import type { Question } from "@/lib/content/types";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { actor } = await requireAdmin(),
    { id } = await params,
    sp = await searchParams;
  const q = getEntity(actor, "question", id) as Question | null;
  if (!q) notFound();
  const dupes = findDuplicateQuestions(q.text, q.id);
  return (
    <>
      <Flash sp={{ ok: first(sp.ok), error: first(sp.error) }} />
      <h2 style={{ marginBottom: 16 }}>Edit question</h2>
      {dupes.length > 0 && (
        <p className="banner" role="alert">
          Possible duplicate:{" "}
          {dupes.map((d) => (
            <Link key={d.id} className="lk" href={`/admin/questions/${d.id}`}>
              {d.slug}
            </Link>
          ))}{" "}
          has the same text.
        </p>
      )}
      <StatusPanel
        kind="question"
        id={id}
        publication={q.publication}
        back={`/admin/questions/${id}`}
        previewHref={`/questions/${q.slug}?preview=1`}
      />
      <ConfigForm action={saveQuestionAction.bind(null, id)} fields={questionFields()} values={questionDefaults(q)} />
      <Revisions rows={revisionsFor("question", id)} />
    </>
  );
}
