import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import Link from "next/link";

export default async function TopicsPage() {
  const { session } = await getCurrent();
  if (!session) redirect("/sign-in?next=/community/topics");

  const topics = await db.communityTopic.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          posts: { where: { visibility: "PUBLIC" } },
          followers: true,
        },
      },
    },
  });

  const followed = await db.userFollowedTopic.findMany({
    where: { userId: session.id },
    select: { topicId: true },
  });
  const followedSet = new Set(followed.map((f) => f.topicId));

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px" }}>
      <h1>Community Topics</h1>
      <p className="mut">Follow topics to see relevant discussions in your feed.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16, marginTop: 24 }}>
        {topics.map((topic) => (
          <Link
            key={topic.id}
            href={`/community/feed?topicId=${topic.id}`}
            style={{
              textDecoration: "none",
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              display: "block",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: "1.1rem" }}>{topic.name}</span>
              <span className="mut" style={{ fontSize: "0.8rem" }}>
                {topic._count.posts} posts • {topic._count.followers} followers
              </span>
            </div>
            {topic.description && <p className="mut" style={{ fontSize: "0.9rem" }}>{topic.description}</p>}
            {followedSet.has(topic.id) && <span style={{ display: "inline-block", marginTop: 8, fontSize: "0.8rem", color: "var(--color-primary)" }}>● Following</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
