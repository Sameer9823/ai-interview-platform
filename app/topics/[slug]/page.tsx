import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/content/public-shell";
import { QuestionFilters, filterParams } from "@/components/content/question-filters";
import { Crumbs, Pager, QuestionCard } from "@/components/content/ui";
import { EmptyState } from "@/components/ui/misc";
import { categoryPath } from "@/lib/content/dto";
import { db } from "@/lib/content/store";
import { getTopic, searchQuestions, topicTree } from "@/lib/content/search";
import { questionQuery } from "@/lib/content/validation";

type P = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const t = getTopic((await params).slug);
  return { title: t ? `${t.name} questions` : "Topic" };
}

export default async function Page({ params, searchParams }: P) {
  const { slug } = await params,
    sp = await searchParams;
  const topic = getTopic(slug);
  if (!topic) notFound();
  const q = questionQuery.parse({
    ...Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])),
    category: slug,
  });
  const r = searchQuestions(q);
  const id = [...db().categories.values()].find((c) => c.slug === slug)!.id;
  const tree = topicTree().flatMap((t) => [t, ...t.children]);
  return (
    <PublicShell>
      <Crumbs
        items={[
          { href: "/questions", label: "Questions" },
          ...categoryPath(id).map((p, i, a) => ({ href: i < a.length - 1 ? `/topics/${p.slug}` : undefined, label: p.name })),
        ]}
      />
      <h1>{topic.name}</h1>
      {topic.children.length > 0 && (
        <nav aria-label="Subtopics" className="meta" style={{ marginTop: 16 }}>
          {topic.children.map((c) => (
            <Link key={c.slug} className="btn o s" href={`/topics/${c.slug}`}>
              {c.name} ({tree.find((t) => t.slug === c.slug)?.count ?? 0})
            </Link>
          ))}
        </nav>
      )}
      <QuestionFilters q={q} action={`/topics/${slug}`} lockCategory />
      <div className="grid g2" style={{ marginTop: 24 }}>
        {r.items.map((x) => (
          <QuestionCard key={x.slug} q={x} />
        ))}
      </div>
      {r.items.length === 0 && <EmptyState>No published questions in this topic yet.</EmptyState>}
      <Pager basePath={`/topics/${slug}`} params={filterParams(q)} page={r.page} totalPages={r.totalPages} total={r.total} />
    </PublicShell>
  );
}
