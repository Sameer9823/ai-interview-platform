import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfigForm } from "@/components/admin/config-form";
import { processDefaults, processFields } from "@/components/admin/fields";
import { Flash, Revisions, StatusPanel, first } from "@/components/admin/ui";
import { saveProcessAction } from "@/features/admin/actions";
import { requireAdmin } from "@/lib/auth/admin";
import { getEntity, revisionsFor } from "@/lib/content/service";
import { db } from "@/lib/content/store";
import type { InterviewProcess } from "@/lib/content/types";

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
  const p = getEntity(actor, "process", id) as InterviewProcess | null;
  if (!p) notFound();
  const company = db().companies.get(p.companyId);
  return (
    <>
      <Flash sp={{ ok: first(sp.ok), error: first(sp.error) }} />
      <h2 style={{ marginBottom: 8 }}>{p.title}</h2>
      {company && (
        <p className="sm mut" style={{ marginBottom: 16 }}>
          Round for{" "}
          <Link className="lk" href={`/admin/companies/${company.id}`}>
            {company.name}
          </Link>
        </p>
      )}
      <StatusPanel
        kind="process"
        id={id}
        publication={p.publication}
        back={`/admin/processes/${id}`}
        previewHref={company ? `/companies/${company.slug}?preview=1` : undefined}
      />
      <ConfigForm action={saveProcessAction.bind(null, id)} fields={processFields()} values={processDefaults(p)} />
      <Revisions rows={revisionsFor("process", id)} />
    </>
  );
}
