"use client";
import { useState, useEffect, useCallback } from "react";
import { Button, Badge } from "@/components/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  color: string | null;
  icon: string | null;
  isSystem: boolean;
  postCount: number;
  followerCount: number;
  isFollowed: boolean;
}

export function CommunitySidebar() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const loadTopics = useCallback(async () => {
    try {
      const res = await fetch("/api/community/topics");
      if (!res.ok) throw new Error("Failed to load topics");
      const data = await res.json();
      setTopics(data.topics);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  const toggleFollow = async (topicId: string, isFollowed: boolean) => {
    try {
      await fetch("/api/community/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isFollowed ? "unfollow" : "follow", topicId }),
      });
      setTopics((prev) => prev.map((t) =>
        t.id === topicId ? { ...t, isFollowed: !isFollowed, followerCount: isFollowed ? t.followerCount - 1 : t.followerCount + 1 } : t
      ));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <aside style={{ width: "280px", flexShrink: 0 }}>
      <nav style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", marginBottom: 12, color: "var(--color-text-muted)" }}>Community</h3>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            { href: "/community", label: "Feed", active: pathname === "/community" || pathname === "/community/feed" },
            { href: "/community/bookmarks", label: "Bookmarks", active: pathname === "/community/bookmarks" },
            { href: "/community/topics", label: "Topics", active: pathname === "/community/topics" },
            { href: "/community/members", label: "Members", active: pathname === "/community/members" },
          ].map((item) => (
            <li key={item.href}>
              <Link href={item.href} style={{ display: "block", padding: "8px 12px", borderRadius: 6, textDecoration: "none", color: "inherit", background: item.active ? "var(--color-primary-bg)" : "transparent", fontWeight: item.active ? 600 : 400 }}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", marginBottom: 12, color: "var(--color-text-muted)" }}>Topics</h3>
        {loading ? (
          <p className="mut" style={{ fontSize: "0.85rem" }}>Loading topics...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {topics.map((topic) => (
              <div key={topic.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 6, background: topic.isFollowed ? "var(--color-primary-bg)" : "var(--color-surface)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                  <span style={{ color: topic.color || "var(--color-primary)" }}>{topic.icon || "📌"}</span>
                  <span style={{ fontSize: "0.9rem", fontWeight: topic.isFollowed ? 600 : 400 }}>{topic.name}</span>
                </div>
                <Button
                  variant={topic.isFollowed ? "solid" : "outline"}
                  size="small"
                  style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                  onClick={() => toggleFollow(topic.id, topic.isFollowed)}
                >
                  {topic.isFollowed ? "Following" : "Follow"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", marginBottom: 12, color: "var(--color-text-muted)" }}>Study Groups</h3>
        <Link href="/study-groups" style={{ color: "inherit", textDecoration: "none" }}>
          <Button variant="outline" style={{ width: "100%" }}>View All Groups</Button>
        </Link>
      </div>
    </aside>
  );
}
