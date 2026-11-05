import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfigForm } from "@/components/admin/config-form";
import { companyDefaults, companyFields } from "@/components/admin/fields";
import { Flash, PubBadge, Revisions, StatusPanel, Table, first } from "@/components/admin/ui";
import { LinkButton } from "@/components/ui/button";
import { saveCompanyAction } from "@/features/admin/actions";
import { requireAdmin } from "@/lib/auth/admin";
import { getEntity, revisionsFor } from "@/lib/content/service";
import { db } from "@/lib/content/store";
import { LABELS, type Company } from "@/lib/content/types";

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
  const c = getEntity(actor, "company", id) as Company | null;
  if (!c) notFound();
  const processes = [...db().processes.values()].filter((p) => p.companyId === id).sort((a, b) => (a.sequence ?? 99) - (b.sequence ?? 99));
  return (
    <>
      <Flash sp={{ ok: first(sp.ok), error: first(sp.error) }} />
      <h2 style={{ marginBottom: 16 }}>{c.name}</h2>
      <StatusPanel
        kind="company"
        id={id}
        publication={c.publication}
        back={`/admin/companies/${id}`}
        previewHref={`/companies/${c.slug}?preview=1`}
      />
      <ConfigForm action={saveCompanyAction.bind(null, id)} fields={companyFields()} values={companyDefaults(c)} />
      <section className="sect">
        <h2>Interview rounds</h2>
        <p className="sm mut" style={{ margin: "8px 0 12px" }}>
          Add a round only when a source supports it. Records are labeled by origin on the public page.
        </p>
        {processes.length > 0 && (
          <Table caption="Rounds for this company" head={["Round", "Type", "Origin", "Status"]}>
            {processes.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link className="lk" href={`/admin/processes/${p.id}`}>
                    {p.sequence ? `${p.sequence}. ` : ""}
                    {p.title}
                  </Link>
                </td>
                <td>{LABELS.roundKind[p.kind]}</td>
                <td>{LABELS.origin[p.origin]}</td>
                <td>
                  <PubBadge p={p.publication} />
                </td>
              </tr>
            ))}
          </Table>
        )}
        <div className="row">
          <LinkButton href={`/admin/processes/new?company=${id}`} variant="outline">
            Add interview round
          </LinkButton>
        </div>
      </section>
      <Revisions rows={revisionsFor("company", id)} />
    </>
  );
}
