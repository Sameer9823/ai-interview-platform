import { Table, when } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/admin";
import { listAudit } from "@/lib/content/service";

export default async function Page() {
  const { actor } = await requireAdmin();
  const rows = listAudit(actor, 200);
  return (
    <>
      <p className="sm mut" style={{ marginBottom: 16 }}>
        Every administrative change is recorded here with who made it. Administrators are shown by a short account id, and nothing sensitive
        is logged.
      </p>
      {rows.length ? (
        <Table caption={`Latest ${rows.length} entries`} head={["When", "By", "Action", "Item", "Summary"]}>
          {rows.map((a) => (
            <tr key={a.id}>
              <td>{when(a.at)}</td>
              <td>{a.actorId.slice(0, 8)}</td>
              <td>{a.action}</td>
              <td>{a.entityType}</td>
              <td>{a.summary}</td>
            </tr>
          ))}
        </Table>
      ) : (
        <p className="banner">No administrative changes recorded yet.</p>
      )}
    </>
  );
}
