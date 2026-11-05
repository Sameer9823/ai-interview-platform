import Link from "next/link";
import { Flash, PubBadge, Table, first, when } from "@/components/admin/ui";
import { Pager } from "@/components/content/ui";
import { SelectField, TextField } from "@/components/ui/field";
import { LinkButton } from "@/components/ui/button";
import { bulkStatusAction } from "@/features/admin/actions";
import { requireAdmin } from "@/lib/auth/admin";
import { listAdmin } from "@/lib/content/service";
import { LABELS, PUBLICATION, type Publication, type Question } from "@/lib/content/types";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { actor } = await requireAdmin(),
    sp = await searchParams;
  const status = PUBLICATION.includes(first(sp.status) as Publication) ? (first(sp.status) as Publication) : undefined;
  const r = listAdmin(actor, "question", { status, q: first(sp.q), page: Number(first(sp.page)) || 1 });
  const back = `/admin/questions${status || first(sp.q) ? `?${new URLSearchParams({ ...(status ? { status } : {}), ...(first(sp.q) ? { q: first(sp.q)! } : {}) })}` : ""}`;
  return (
    <>
      <Flash sp={{ ok: first(sp.ok), error: first(sp.error) }} />
      <div className="row" style={{ marginTop: 0 }}>
        <LinkButton href="/admin/questions/new">New question</LinkButton>
      </div>
      <form method="get" className="filters">
        <TextField id="q" label="Search" defaultValue={first(sp.q) ?? ""} />
        <SelectField id="status" label="Status" options={LABELS.publication} defaultValue={status ?? ""} />
        <div className="row">
          <button className="btn o" type="submit">
            Filter
          </button>
        </div>
      </form>
      <form action={bulkStatusAction.bind(null, "question")} style={{ marginTop: 24 }}>
        <input type="hidden" name="back" value={back} />
        <Table caption={`${r.total} questions`} head={["Select", "Question", "Difficulty", "Status", "Origin", "Updated"]}>
          {(r.items as Question[]).map((q) => (
            <tr key={q.id}>
              <td>
                <input
                  type="checkbox"
                  name="ids"
                  value={q.id}
                  aria-label={`Select ${q.slug}`}
                  style={{ width: 18, height: 18, accentColor: "var(--fg)" }}
                />
              </td>
              <td>
                <Link className="lk" href={`/admin/questions/${q.id}`}>
                  {q.text.slice(0, 90)}
                </Link>
              </td>
              <td>{LABELS.difficulty[q.difficulty]}</td>
              <td>
                <PubBadge p={q.publication} />
              </td>
              <td>{LABELS.origin[q.origin]}</td>
              <td>{when(q.updatedAt)}</td>
            </tr>
          ))}
        </Table>
        <fieldset className="filters" style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 16 }}>
          <legend style={{ padding: "0 8px", fontWeight: 600 }}>Bulk change for selected questions</legend>
          <SelectField id="to" label="Move to" options={LABELS.publication} />
          <label style={{ display: "flex", gap: 8, fontWeight: 400, alignItems: "center" }}>
            <input type="checkbox" name="confirm" style={{ width: 18, height: 18, accentColor: "var(--fg)" }} />I confirm this change for
            every selected question
          </label>
          <div className="row">
            <button className="btn o" type="submit">
              Apply to selected
            </button>
          </div>
          <p className="sm mut" style={{ gridColumn: "1 / -1" }}>
            Each question still has to pass the publishing rules. Refusals are listed with a reason.
          </p>
        </fieldset>
      </form>
      <Pager basePath="/admin/questions" params={{ q: first(sp.q), status }} page={r.page} totalPages={r.totalPages} total={r.total} />
    </>
  );
}
