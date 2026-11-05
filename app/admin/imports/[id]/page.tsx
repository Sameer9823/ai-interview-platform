import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash, Table, first, when } from "@/components/admin/ui";
import { Card } from "@/components/ui/misc";
import { commitImportAction } from "@/features/admin/actions";
import { requireAdmin } from "@/lib/auth/admin";
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
  const j = db().imports.get(id);
  if (!j) notFound();
  const src = db().sources.get(j.sourceId);
  const shown = j.staged.slice(0, 100);
  return (
    <>
      <Flash sp={{ ok: first(sp.ok), error: first(sp.error) }} />
      <h2 style={{ marginBottom: 8 }}>{j.filename}</h2>
      <p className="sm mut">
        {j.kind} from{" "}
        {src ? (
          <Link className="lk" href={`/admin/sources/${src.id}`}>
            {src.title}
          </Link>
        ) : (
          "a removed source"
        )}{" "}
        · uploaded {when(j.createdAt)} · status {j.status.replace("_", " ").toLowerCase()}
      </p>
      <Card style={{ maxWidth: 720, marginTop: 16 }}>
        <p>{j.message}</p>
        <ul className="l" style={{ marginTop: 12 }}>
          <li>
            <span className="mut">Rows in file</span>
            <span>{j.counts.total}</span>
          </li>
          <li>
            <span className="mut">Valid</span>
            <span>{j.counts.valid}</span>
          </li>
          <li>
            <span className="mut">Invalid</span>
            <span>{j.counts.invalid}</span>
          </li>
          <li>
            <span className="mut">Duplicate</span>
            <span>{j.counts.duplicate}</span>
          </li>
          <li>
            <span className="mut">Skipped</span>
            <span>{j.counts.skipped}</span>
          </li>
          <li>
            <span className="mut">Created</span>
            <span>{j.counts.created}</span>
          </li>
        </ul>
        {j.counts.invalid + j.counts.duplicate > 0 && (
          <p className="sm" style={{ marginTop: 12 }}>
            <a className="lk" href={`/admin/imports/${id}/errors`}>
              Download the error report (CSV)
            </a>
          </p>
        )}
        {j.status === "PREVIEWED" ? (
          <form action={commitImportAction.bind(null, id)}>
            <label style={{ display: "flex", gap: 8, fontWeight: 400, marginTop: 16, alignItems: "center" }}>
              <input type="checkbox" name="confirm" style={{ width: 18, height: 18, accentColor: "var(--fg)" }} />
              Create {j.counts.valid} draft {j.kind}. Nothing will be published.
            </label>
            <div className="row">
              <button className="btn" type="submit" disabled={j.counts.valid === 0}>
                Confirm import
              </button>
            </div>
          </form>
        ) : (
          <p className="sm mut" style={{ marginTop: 16 }}>
            This import cannot be committed ({j.status.replace("_", " ").toLowerCase()}).
          </p>
        )}
      </Card>
      <section className="sect">
        <h2>Preview{j.staged.length > shown.length ? ` (first ${shown.length} of ${j.staged.length} rows)` : ""}</h2>
        <div style={{ marginTop: 12 }}>
          <Table caption="Each row as it was understood" head={["Row", "Result", "Details", "Content"]}>
            {shown.map((r) => (
              <tr key={r.row}>
                <td>{r.row}</td>
                <td>{r.status.toLowerCase()}</td>
                <td>
                  {r.errors.join("; ") || "Ready"}
                  {r.duplicateOf ? ` (${r.duplicateOf})` : ""}
                </td>
                <td>{r.preview}</td>
              </tr>
            ))}
          </Table>
        </div>
      </section>
    </>
  );
}
