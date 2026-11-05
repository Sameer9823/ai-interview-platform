import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import Link from "next/link";
import { Button, Card, EmptyState } from "@/components/ui";

export default async function SavedPostsPage() {
  const { session } = await getCurrent();
  if (!session) redirect("/sign-in?next=/community/saved");

  const savedPosts = await db.savedCommunityPost.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    include: {
      post: {
        include: {
          topic: { select: { id: true, name: true, color: true } },
          author: { select: { id: true, name: true } },
        },
      },
    },
  });

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1>Saved Posts</h1>
        <Link href="/community">
          <Button variant="outline" size="small">Back to Community</Button>
        </Link>
      </div>

      {savedPosts.length === 0 ? (
        <EmptyState>
          <h3>No saved posts yet</h3>
          <p>Save interesting posts to read them later.</p>
        </EmptyState>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {savedPosts.map((s) => (
            <Card key={s.id} style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: s.post.topic?.color || "var(--color-text-muted)" }}>{s.post.topic?.name || "General"}</span>
                  <span className="mut" style={{ fontSize: "0.8rem" }}>{s.post.author.name}</span>
                </div>
                <Link href={`/community/posts/${s.post.id}`}>
                  <h3 style={{ margin: "4px 0", fontWeight: 600, textDecoration: "none", color: "inherit" }}>{s.post.title}</h3>
                </Link>
                {s.post.description && <p className="mut" style={{ fontSize: "0.9rem" }}>{s.post.description.substring(0, 150)}...</p>}
              </div>
              <Link href={`/community/posts/${s.post.id}`}>
                <Button variant="outline" size="small">View</Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
