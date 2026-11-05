import type { Metadata } from "next";
import { Pager, QuestionCard } from "@/components/content/ui";
import { EmptyState } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guard";
import { listSaved } from "@/lib/content/search";

export const metadata: Metadata = { title: "Saved questions" };
export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireUser("/saved");
  const page = Math.max(1, Math.min(1000, Number((await searchParams).page) || 1));
  const r = listSaved(user.id, page, 12);
  return (
    <>
      <h1>Saved questions</h1>
      <p className="mut" style={{ margin: "8px 0 24px" }}>
        Only you can see this list.
        {r.hidden > 0 ? ` ${r.hidden} saved ${r.hidden === 1 ? "question is" : "questions are"} no longer published and hidden.` : ""}
      </p>
      <div className="grid g2" style={{ marginTop: 0 }}>
        {r.items.map((x) => (
          <QuestionCard key={x.slug} q={x} />
        ))}
      </div>
      {r.items.length === 0 && (
        <EmptyState>
          Nothing saved yet. Open a question and choose Save question.
          <div className="row">
            <LinkButton href="/questions" variant="outline">
              Browse questions
            </LinkButton>
          </div>
        </EmptyState>
      )}
      <Pager basePath="/saved" params={{}} page={r.page} totalPages={r.totalPages} total={r.total} />
    </>
  );
}
