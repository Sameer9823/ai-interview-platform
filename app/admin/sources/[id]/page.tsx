import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfigForm } from "@/components/admin/config-form";
import { sourceDefaults, sourceFields } from "@/components/admin/fields";
import { Flash, Table, first, when } from "@/components/admin/ui";
import { LinkButton } from "@/components/ui/button";
import { markCheckedAction, saveSourceAction } from "@/features/admin/actions";
import { requireAdmin } from "@/lib/auth/admin";
import { adminHref, dependentsOf } from "@/lib/content/service";
import { importBlocker } from "@/lib/content/import/pipeline";
import { db } from "@/lib/content/store";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const { id } = await params,
    sp = await searchParams;
  const s = db().sources.get(id);
  if (!s) notFound();
  const deps = dependentsOf(id),
    blocker = importBlocker(s);
  const maps = { company: db().companies, process: db().processes, question: db().questions, experience: db().experiences } as const;
  return (
    <>
      <Flash sp={{ ok: first(sp.ok), error: first(sp.error) }} />
      <h2 style={{ marginBottom: 8 }}>{s.title}</h2>
      <p className="sm mut" style={{ marginBottom: 16 }}>
        Last checked {when(s.lastCheckedAt)} · last import {when(s.lastImportAt)} ·{" "}
        {blocker ? `Imports blocked: ${blocker}` : "Imports allowed"}
      </p>
      <div className="row" style={{ marginTop: 0, marginBottom: 24 }}>
        <form action={markCheckedAction.bind(null, id)}>
          <button className="btn o s" type="submit">
            Mark as checked today
          </button>
        </form>
        <LinkButton href={`/admin/imports?source=${id}`} variant="outline" small>
          Import from this source
        </LinkButton>
      </div>
      <p className="banner">
        Lowering the permission, or rejecting this source, returns all {deps.length} published items that rely on it to the review queue.
      </p>
      <ConfigForm action={saveSourceAction.bind(null, id)} fields={sourceFields()} values={sourceDefaults(s)} />
      <section className="sect">
        <h2>Content that relies on this source</h2>
        <div style={{ marginTop: 12 }}>
          {deps.length ? (
            <Table caption={`${deps.length} items`} head={["Type", "Title", "Status"]}>
              {deps.map((d) => {
                const e = maps[d.kind].get(d.id)!;
                return (
                  <tr key={d.id}>
                    <td>{d.kind}</td>
                    <td>
                      <Link className="lk" href={adminHref(d.kind, e)}>
                        {"name" in e ? e.name : "text" in e ? e.text.slice(0, 80) : "title" in e ? e.title : e.role}
                      </Link>
                    </td>
                    <td>{e.publication}</td>
                  </tr>
                );
              })}
            </Table>
          ) : (
            <p className="sm mut">Nothing uses this source yet.</p>
          )}
        </div>
      </section>
    </>
  );
}
