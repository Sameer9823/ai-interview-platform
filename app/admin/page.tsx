import Link from "next/link";
import { Card } from "@/components/ui/misc";
import { Table, when } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/admin";
import { adminStats } from "@/lib/content/service";

export default async function Page() {
  const { actor } = await requireAdmin();
  const s = adminStats(actor);
  const cards: [string, number, string][] = [
    ["Published questions", s.publishedQuestions, "/admin/questions?status=PUBLISHED"],
    ["Draft questions", s.draftQuestions, "/admin/questions?status=DRAFT"],
    ["Pending reviews", s.pendingReviews, "/admin/review"],
    ["Published companies", s.publishedCompanies, "/admin/companies?status=PUBLISHED"],
    ["Registered sources", s.sources, "/admin/sources"],
    ["Failed imports", s.failedImports, "/admin/imports"],
  ];
  return (
    <>
      <p className="sm mut" style={{ marginBottom: 16 }}>
        Every number comes from the content records. Nothing here is a fixed value.
      </p>
      <div className="grid g3" style={{ marginTop: 0 }}>
        {cards.map(([l, n, h]) => (
          <Link key={l} href={h} className="card h qcard">
            <p className="sm mut">{l}</p>
            <p style={{ fontSize: "2.25rem", lineHeight: "2.5rem", fontWeight: 600 }}>{n}</p>
          </Link>
        ))}
      </div>
      <section className="sect">
        <h2>Recent content updates</h2>
        <div style={{ marginTop: 12 }}>
          {s.recent.length ? (
            <Table caption="Last eight changes" head={["Type", "Title", "Updated"]}>
              {s.recent.map((r) => (
                <tr key={r.kind + r.id}>
                  <td>{r.kind}</td>
                  <td>
                    <Link className="lk" href={r.href}>
                      {r.title}
                    </Link>
                  </td>
                  <td>{when(r.updatedAt)}</td>
                </tr>
              ))}
            </Table>
          ) : (
            <Card>
              <p className="sm mut">No content yet.</p>
            </Card>
          )}
        </div>
      </section>
    </>
  );
}
