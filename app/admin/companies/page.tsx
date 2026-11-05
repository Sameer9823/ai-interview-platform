import Link from "next/link";
import { Flash, PubBadge, Table, first, when } from "@/components/admin/ui";
import { Pager } from "@/components/content/ui";
import { SelectField, TextField } from "@/components/ui/field";
import { LinkButton } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/admin";
import { listAdmin } from "@/lib/content/service";
import { LABELS, PUBLICATION, type Company, type Publication } from "@/lib/content/types";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { actor } = await requireAdmin(),
    sp = await searchParams;
  const status = PUBLICATION.includes(first(sp.status) as Publication) ? (first(sp.status) as Publication) : undefined;
  const r = listAdmin(actor, "company", { status, q: first(sp.q), page: Number(first(sp.page)) || 1 });
  return (
    <>
      <Flash sp={{ ok: first(sp.ok), error: first(sp.error) }} />
      <div className="row" style={{ marginTop: 0 }}>
        <LinkButton href="/admin/companies/new">New company</LinkButton>
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
        <Table caption={`${r.total} companies`} head={["Name", "Industry", "Status", "Verification", "Updated"]}>
          {(r.items as Company[]).map((c) => (
            <tr key={c.id}>
              <td>
                <Link className="lk" href={`/admin/companies/${c.id}`}>
                  {c.name}
                </Link>
              </td>
              <td>{c.industry}</td>
              <td>
                <PubBadge p={c.publication} />
              </td>
              <td>{LABELS.verification[c.verification]}</td>
              <td>{when(c.updatedAt)}</td>
            </tr>
          ))}
        </Table>
      </div>
      <Pager basePath="/admin/companies" params={{ q: first(sp.q), status }} page={r.page} totalPages={r.totalPages} total={r.total} />
    </>
  );
}
