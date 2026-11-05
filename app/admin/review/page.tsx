import Link from "next/link";
import { Flash, Table, first, when } from "@/components/admin/ui";
import { setStatusAction } from "@/features/admin/actions";
import { requireAdmin } from "@/lib/auth/admin";
import { reviewQueue } from "@/lib/content/service";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { actor } = await requireAdmin();
  const sp = await searchParams;
  const q = reviewQueue(actor);
  return (
    <>
      <Flash sp={{ ok: first(sp.ok), error: first(sp.error) }} />
      <p className="sm mut" style={{ marginBottom: 16 }}>
        Items wait here until an administrator approves or rejects them. Approval still needs every publishing rule to pass.
      </p>
      {q.length === 0 ? (
        <p className="banner">Nothing is waiting for review.</p>
      ) : (
        <Table caption={`${q.length} waiting`} head={["Type", "Item", "Updated", "Checklist", "Decision"]}>
          {q.map((i) => (
            <tr key={i.kind + i.id}>
              <td>{i.kind}</td>
              <td>
                <Link className="lk" href={i.href}>
                  {i.title.slice(0, 80)}
                </Link>
                {i.notes && <div className="sm mut">{i.notes.split("\n").slice(-1)[0]?.slice(0, 120)}</div>}
              </td>
              <td>{when(i.updatedAt)}</td>
              <td>
                {i.blockers.length ? (
                  <ul style={{ paddingLeft: 16, margin: 0 }}>
                    {i.blockers.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                ) : (
                  "Ready to publish"
                )}
              </td>
              <td>
                <form action={setStatusAction.bind(null, i.kind, i.id)} className="row" style={{ marginTop: 0 }}>
                  <input type="hidden" name="back" value="/admin/review" />
                  <input type="hidden" name="to" value="PUBLISHED" />
                  <button className="btn s" type="submit" disabled={i.blockers.length > 0}>
                    Approve and publish
                  </button>
                </form>
                <form action={setStatusAction.bind(null, i.kind, i.id)} className="row" style={{ marginTop: 8 }}>
                  <input type="hidden" name="back" value="/admin/review" />
                  <input type="hidden" name="to" value="REJECTED" />
                  <input name="note" aria-label="Reason for rejection" placeholder="Reason" style={{ maxWidth: 160 }} />
                  <button className="btn o s" type="submit">
                    Reject
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
