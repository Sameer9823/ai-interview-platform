import Link from "next/link";
import { Flash, Table, first, when } from "@/components/admin/ui";
import { Card } from "@/components/ui/misc";
import { stageImportAction } from "@/features/admin/actions";
import { requireAdmin } from "@/lib/auth/admin";
import { importBlocker, MAX_BYTES } from "@/lib/content/import/pipeline";
import { db } from "@/lib/content/store";
import { LABELS } from "@/lib/content/types";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const sources = [...db().sources.values()].sort((a, b) => a.title.localeCompare(b.title));
  const jobs = [...db().imports.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <Flash sp={{ ok: first(sp.ok), error: first(sp.error) }} />
      <Card style={{ maxWidth: 720 }}>
        <h2>Upload a file</h2>
        <p className="sm mut" style={{ marginTop: 8 }}>
          CSV or JSON, up to {MAX_BYTES / 1000} KB and 1000 rows. Nothing is fetched from the web. Records are checked and previewed first,
          and are created as drafts only after you confirm.
        </p>
        <form action={stageImportAction} encType="multipart/form-data">
          <div className="field">
            <label htmlFor="kind">What are you importing?</label>
            <select id="kind" name="kind">
              <option value="questions">Questions</option>
              <option value="companies">Companies</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="sourceId">Source of the data</label>
            <select id="sourceId" name="sourceId" defaultValue={first(sp.source) ?? ""}>
              <option value="">Choose a source</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({LABELS.permission[s.permission]}){importBlocker(s) ? " : preview only" : ""}
                </option>
              ))}
            </select>
            <div className="hint">
              Only Approved and Attribution required sources can be committed. Others can be previewed but not imported.
            </div>
          </div>
          <div className="field">
            <label htmlFor="file">File</label>
            <input id="file" name="file" type="file" accept=".csv,.json,text/csv,application/json" />
          </div>
          <div className="row">
            <button className="btn" type="submit">
              Validate and preview
            </button>
          </div>
        </form>
        <details className="ans">
          <summary>Expected columns</summary>
          <p className="sm" style={{ marginTop: 8 }}>
            <b>Questions:</b> text, category, type, difficulty, answerOutline are required. Optional: roles, careerStages, experienceLevels,
            skills, tags, companies, explanation, exampleAnswer, codeSolution, codeLanguage, hints, options, estimatedMinutes. In CSV,
            separate list values with a pipe (|). Mark the correct option with * at the start.
          </p>
          <p className="sm" style={{ marginTop: 8 }}>
            <b>Companies:</b> name, website, careersUrl, industry are required. Optional: description, headquarters, roleCategories. See
            docs/IMPORTS.md and docs/samples/.
          </p>
        </details>
      </Card>
      <section className="sect">
        <h2>Import history</h2>
        <div style={{ marginTop: 12 }}>
          {jobs.length ? (
            <Table caption={`${jobs.length} imports`} head={["When", "File", "Type", "Status", "Valid", "Invalid", "Duplicate", "Created"]}>
              {jobs.map((j) => (
                <tr key={j.id}>
                  <td>{when(j.createdAt)}</td>
                  <td>
                    <Link className="lk" href={`/admin/imports/${j.id}`}>
                      {j.filename}
                    </Link>
                  </td>
                  <td>{j.kind}</td>
                  <td>{j.status.replace("_", " ").toLowerCase()}</td>
                  <td>{j.counts.valid}</td>
                  <td>{j.counts.invalid}</td>
                  <td>{j.counts.duplicate}</td>
                  <td>{j.counts.created}</td>
                </tr>
              ))}
            </Table>
          ) : (
            <p className="sm mut">No imports yet.</p>
          )}
        </div>
      </section>
    </>
  );
}
