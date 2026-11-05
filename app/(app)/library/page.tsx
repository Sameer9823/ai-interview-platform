import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/misc";
import { topicTree } from "@/lib/content/search";
import { db } from "@/lib/content/store";

export const metadata: Metadata = { title: "Preparation Library" };
export default function Page() {
  const d = db();
  const n = (m: { publication: string }[]) => m.filter((x) => x.publication === "PUBLISHED").length;
  const hub = [
    [
      "/questions",
      "Question bank",
      `${n([...d.questions.values()])} published questions`,
      "Search and filter practice questions by topic, difficulty, role and more.",
    ],
    [
      "/companies",
      "Companies",
      `${n([...d.companies.values()])} company profiles`,
      "Official links and source labeled preparation content.",
    ],
    [
      "/interview-experiences",
      "Interview experiences",
      `${n([...d.experiences.values()])} published`,
      "Reported by candidates. Never official.",
    ],
    ["/saved", "Saved questions", "Your bookmarks", "Questions you saved for later."],
  ];
  return (
    <>
      <h1>Preparation Library</h1>
      <p className="mut" style={{ margin: "8px 0 24px" }}>
        Everything here shows where it came from. Counts come from published records.
      </p>
      <div className="grid g2" style={{ marginTop: 0 }}>
        {hub.map(([href, title, count, text]) => (
          <Link key={href} href={href!} className="card h qcard">
            <h3>{title}</h3>
            <p className="sm mut">{count}</p>
            <p style={{ marginTop: 8 }}>{text}</p>
          </Link>
        ))}
      </div>
      <h2 style={{ marginTop: 48 }}>Topics</h2>
      <div className="grid g3">
        {topicTree().map((t) => (
          <Card key={t.slug}>
            <h3>
              <Link className="lk" href={`/topics/${t.slug}`}>
                {t.name}
              </Link>
            </h3>
            <p className="sm mut">{t.count} questions</p>
            <ul className="l" style={{ marginTop: 12 }}>
              {t.children.map((c) => (
                <li key={c.slug}>
                  <Link className="lk" href={`/topics/${c.slug}`}>
                    {c.name}
                  </Link>
                  <span className="sm mut">{c.count}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </>
  );
}
