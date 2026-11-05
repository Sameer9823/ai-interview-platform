import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, Card } from "@/components/ui/misc";
import { setStatusAction } from "@/features/admin/actions";
import { canTransition, publishBlockers } from "@/lib/content/service";
import { LABELS, PUBLICATION, type ContentKind, type Publication } from "@/lib/content/types";
import { db } from "@/lib/content/store";

export function Flash({ sp }: { sp: { ok?: string; error?: string } }) {
  return (
    <>
      {sp.ok && (
        <p className="banner" role="status">
          {String(sp.ok).slice(0, 400)}
        </p>
      )}
      {sp.error && (
        <p className="err banner" role="alert" style={{ borderStyle: "solid" }}>
          {String(sp.error).slice(0, 400)}
        </p>
      )}
    </>
  );
}
export const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
export const when = (iso: string | null) => (iso ? iso.slice(0, 16).replace("T", " ") : "never");
export function Table({ caption, head, children }: { caption: string; head: string[]; children: ReactNode }) {
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
export const PubBadge = ({ p }: { p: Publication }) => <Badge>{LABELS.publication[p]}</Badge>;

/** Current status, publish checklist and the transitions that are allowed from here. */
export function StatusPanel({
  kind,
  id,
  publication,
  back,
  previewHref,
}: {
  kind: ContentKind;
  id: string;
  publication: Publication;
  back: string;
  previewHref?: string;
}) {
  const map = ({ company: db().companies, process: db().processes, question: db().questions, experience: db().experiences } as const)[kind];
  const entity = map.get(id)!;
  const blockers = publishBlockers(kind, entity);
  const to = PUBLICATION.filter((p) => canTransition(publication, p));
  return (
    <Card style={{ maxWidth: 720, marginBottom: 24 }}>
      <h3>Status: {LABELS.publication[publication]}</h3>
      <p className="sm mut">
        Version {entity.version} · updated {when(entity.updatedAt)}
        {previewHref && (
          <>
            {" "}
            ·{" "}
            <Link className="lk" href={previewHref}>
              Preview as a visitor would see it
            </Link>
          </>
        )}
      </p>
      <h4 style={{ marginTop: 16, fontSize: ".875rem" }}>Publish checklist</h4>
      {blockers.length ? (
        <ul className="l" style={{ marginTop: 8 }}>
          {blockers.map((b) => (
            <li key={b} style={{ display: "block" }}>
              Not ready: {b}
            </li>
          ))}
        </ul>
      ) : (
        <p className="sm" style={{ marginTop: 8 }}>
          Ready: all publishing rules are met.
        </p>
      )}
      <div className="stack" style={{ marginTop: 16 }}>
        {to.map((p) => (
          <form key={p} action={setStatusAction.bind(null, kind, id)} className="row" style={{ marginTop: 8 }}>
            <input type="hidden" name="to" value={p} />
            <input type="hidden" name="back" value={back} />
            {p === "REJECTED" && (
              <input aria-label="Reason for rejection" name="note" placeholder="Reason (required)" style={{ maxWidth: 260 }} />
            )}
            <button className={`btn s${p === "PUBLISHED" ? "" : " o"}`} type="submit">
              {
                {
                  IN_REVIEW: "Send to review",
                  PUBLISHED: "Publish",
                  UNPUBLISHED: "Unpublish",
                  ARCHIVED: "Archive",
                  DRAFT: "Return to draft",
                  REJECTED: "Reject",
                }[p]
              }
            </button>
          </form>
        ))}
        {to.length === 0 && <p className="sm mut">No further changes are possible from this status.</p>}
      </div>
    </Card>
  );
}
export function Revisions({ rows }: { rows: { version: number; at: string; actorId: string; changed: string[] }[] }) {
  return (
    <section className="sect">
      <h2>Version history</h2>
      <div style={{ marginTop: 12 }}>
        {rows.length ? (
          <Table caption="Every saved change" head={["Version", "When", "By", "Changed"]}>
            {rows.map((r) => (
              <tr key={r.version}>
                <td>{r.version}</td>
                <td>{when(r.at)}</td>
                <td>{r.actorId.slice(0, 8)}</td>
                <td>{r.changed.join(", ") || "created"}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <p className="sm mut">No recorded changes.</p>
        )}
      </div>
    </section>
  );
}
