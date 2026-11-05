import Link from "next/link";
import { Flash, PubBadge, Table, first, when } from "@/components/admin/ui";
import { Pager } from "@/components/content/ui";
import { SelectField, TextField } from "@/components/ui/field";
import { LinkButton } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/admin";
import { listAdmin } from "@/lib/content/service";
import { db } from "@/lib/content/store";
import { LABELS, PUBLICATION, type Experience, type Publication } from "@/lib/content/types";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { actor } = await requireAdmin(),
    sp = await searchParams;
  const status = PUBLICATION.includes(first(sp.status) as Publication) ? (first(sp.status) as Publication) : undefined;
  const r = listAdmin(actor, "experience", { status, q: first(sp.q), page: Number(first(sp.page)) || 1 });
  return (
    <>
      <Flash sp={{ ok: first(sp.ok), error: first(sp.error) }} />
      <div className="row" style={{ marginTop: 0 }}>
        <LinkButton href="/admin/experiences/new">New experience</LinkButton>
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
      <div style={{ marginTop: 24 }}>
        <Table caption={`${r.total} experiences`} head={["Company and role", "Origin", "Verification", "Status", "Updated"]}>
          {(r.items as Experience[]).map((e) => (
            <tr key={e.id}>
              <td>
                <Link className="lk" href={`/admin/experiences/${e.id}`}>
                  {db().companies.get(e.companyId)?.name}: {e.role}
                </Link>
              </td>
              <td>{LABELS.origin[e.origin]}</td>
              <td>{LABELS.verification[e.verification]}</td>
              <td>
                <PubBadge p={e.publication} />
              </td>
              <td>{when(e.updatedAt)}</td>
            </tr>
          ))}
        </Table>
        {r.total === 0 && (
          <p className="sm mut" style={{ marginTop: 12 }}>
            No experiences yet. Add only real, sourced reports. Nothing is pre-filled.
          </p>
        )}
      </div>
      <Pager basePath="/admin/experiences" params={{ q: first(sp.q), status }} page={r.page} totalPages={r.totalPages} total={r.total} />
    </>
  );
}
