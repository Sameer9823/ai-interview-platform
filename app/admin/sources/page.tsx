import Link from "next/link";
import { Flash, Table, first, when } from "@/components/admin/ui";
import { LinkButton } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/admin";
import { dependentsOf } from "@/lib/content/service";
import { db } from "@/lib/content/store";
import { LABELS } from "@/lib/content/types";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const rows = [...db().sources.values()].sort((a, b) => a.title.localeCompare(b.title));
  return (
    <>
      <Flash sp={{ ok: first(sp.ok), error: first(sp.error) }} />
      <div className="row" style={{ marginTop: 0 }}>
        <LinkButton href="/admin/sources/new">Register a source</LinkButton>
      </div>
      <p className="banner" style={{ marginTop: 16 }}>
        Sources from the original research list start as unreviewed. A public website is not permission to copy it. Only Approved and
        Attribution required allow imports.
      </p>
      <Table
        caption={`${rows.length} registered sources`}
        head={["Source", "Type", "Permission", "Review", "Last checked", "Last import", "Used by"]}
      >
        {rows.map((s) => (
          <tr key={s.id}>
            <td>
              <Link className="lk" href={`/admin/sources/${s.id}`}>
                {s.title}
              </Link>
            </td>
            <td>{LABELS.sourceType[s.type]}</td>
            <td>{LABELS.permission[s.permission]}</td>
            <td>{LABELS.sourceReview[s.reviewStatus]}</td>
            <td>{when(s.lastCheckedAt)}</td>
            <td>{when(s.lastImportAt)}</td>
            <td>{dependentsOf(s.id).length}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
