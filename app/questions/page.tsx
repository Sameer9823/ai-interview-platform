import type { Metadata } from "next";
import { PublicShell } from "@/components/content/public-shell";
import { QuestionFilters, filterParams } from "@/components/content/question-filters";
import { Pager, QuestionCard } from "@/components/content/ui";
import { EmptyState } from "@/components/ui/misc";
import { searchQuestions } from "@/lib/content/search";
import { questionQuery } from "@/lib/content/validation";

export const metadata: Metadata = {
  title: "Question bank",
  description: "Practice questions for aptitude, technical, behavioral and role specific interviews.",
};
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = questionQuery.parse(Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])));
  const r = searchQuestions(q);
  return (
    <PublicShell>
      <h1>Question bank</h1>
      <p className="mut" style={{ marginTop: 8, maxWidth: "42.5rem" }}>
        Practice questions with answer outlines. Each one shows where it came from. Original practice questions are written for this
        platform and are not real company interview questions.
      </p>
      <QuestionFilters q={q} />
      <div className="grid g2" style={{ marginTop: 24 }} aria-live="polite">
        {r.items.map((x) => (
          <QuestionCard key={x.slug} q={x} />
        ))}
      </div>
      {r.items.length === 0 && <EmptyState>No questions match these filters. Try fewer filters or a different keyword.</EmptyState>}
      <Pager basePath="/questions" params={filterParams(q)} page={r.page} totalPages={r.totalPages} total={r.total} />
    </PublicShell>
  );
}
