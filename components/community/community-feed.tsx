"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { Button, Card, Input, Textarea, Select, Badge, ProgressBar, EmptyState } from "@/components/ui";
import { CommunityPostForm } from "./community-post-form";

interface Post {
  id: string;
  title: string;
  description: string;
  topic: { id: string; name: string; slug: string; color: string | null; icon: string | null };
  author: { id: string; name: string };
  question: { id: string; slug: string; text: string; difficulty: string; type: string } | null;
  visibility: string;
  imageUrl: string | null;
  resourceUrl: string | null;
  viewCount: number;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
  reactionCount: number;
  userReaction: string | null;
  isSaved: boolean;
}

interface CommunityFeedProps {
  userId: string;
}

const SORT_OPTIONS = [
  { value: "latest", label: "Latest" },
  { value: "popular", label: "Popular" },
  { value: "following", label: "Following" },
];

export function CommunityFeed({ userId }: CommunityFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("latest");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const loadPosts = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sortBy,
        limit: "20",
        ...(cursor && !reset && { cursor }),
        ...(selectedTopic && { topicId: selectedTopic }),
      });
      const res = await fetch(`/api/community/posts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load posts");
      const data = await res.json();
      if (reset) {
        setPosts(data.posts);
      } else {
        setPosts((prev) => [...prev, ...data.posts]);
      }
      setHasMore(data.hasNextPage);
      setCursor(data.nextCursor);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [loading, cursor, sortBy, selectedTopic]);

  const loadMore = () => {
    if (!hasMore || loading) return;
    loadPosts(false);
  };

  const refresh = () => loadPosts(true);

  const handleReact = async (postId: string, reaction: string) => {
    try {
      await fetch("/api/community/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "react", postId, reaction }),
      });
      setPosts((prev) => prev.map((p) => {
        if (p.id !== postId) return p;
        const hasReaction = p.userReaction === reaction;
        return {
          ...p,
          reactionCount: hasReaction ? p.reactionCount - 1 : p.reactionCount + 1,
          userReaction: hasReaction ? null : reaction,
        };
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (postId: string) => {
    try {
      await fetch("/api/community/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", postId }),
      });
      setPosts((prev) => prev.map((p) => {
        if (p.id !== postId) return p;
        return { ...p, isSaved: !p.isSaved };
      }));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Community Feed</h1>
          <p className="mut" style={{ margin: 0 }}>Connect with other learners preparing for interviews.</p>
        </div>
        <Button variant="solid" onClick={() => setShowCreate(true)}>Create Post</Button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <Select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); loadPosts(true); }}
          options={SORT_OPTIONS}
        />
        <Button variant="outline" size="small" onClick={refresh}>Refresh</Button>
      </div>

      {showCreate && <CommunityPostForm userId={userId} onClose={() => setShowCreate(false)} onCreated={refresh} />}

      {posts.length === 0 && !loading && (
        <EmptyState>
          <h3>No posts yet</h3>
          <p>Be the first to start a discussion!</p>
          <Button variant="solid" onClick={() => setShowCreate(true)}>Create Post</Button>
        </EmptyState>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onReact={handleReact}
            onSave={handleSave}
          />
        ))}
      </div>

      {hasMore && (
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}

function PostCard({ post, onReact, onSave }: {
  post: Post;
  onReact: (postId: string, reaction: string) => void;
  onSave: (postId: string) => void;
}) {
  const primaryReaction = post.userReaction || "LIKE";

  return (
    <Card style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
          <span style={{ fontWeight: 600 }}>{post.author.name}</span>
          {post.topic && (
            <>
              <span className="mut">·</span>
              <Badge style={{ background: post.topic.color || "var(--color-primary-bg)" }}>{post.topic.name}</Badge>
            </>
          )}
          <span className="mut" style={{ fontSize: "0.8rem" }}>{new Date(post.createdAt).toLocaleDateString()}</span>
          {post.isPinned && <Badge>Pinned</Badge>}
        </div>
        <Button
          variant={post.isSaved ? "solid" : "outline"}
          size="small"
          onClick={() => onSave(post.id)}
        >
          {post.isSaved ? "★" : "☆"}
        </Button>
      </div>

      <Link href={`/community/posts/${post.id}`}>
        <h3 style={{ margin: "0 0 8px", fontWeight: 600, textDecoration: "none", color: "inherit" }}>{post.title}</h3>
      </Link>
      {post.description && (
        <p className="mut" style={{ margin: "0 0 12px", fontSize: "0.9rem" }}>{post.description.substring(0, 200)}...</p>
      )}

      {post.question && (
        <Card style={{ padding: 12, marginBottom: 12, background: "var(--color-surface)" }}>
          <Badge>{post.question.type}</Badge>
          <p style={{ fontSize: "0.9rem", margin: "4px 0" }}>{post.question.text.substring(0, 200)}...</p>
        </Card>
      )}

      <div style={{ display: "flex", gap: 16, alignItems: "center", paddingTop: 8, borderTop: "1px solid var(--color-border)" }}>
        <button onClick={() => onReact(post.id, "LIKE")} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem" }}>
          <span style={{ color: post.userReaction === "LIKE" ? "var(--color-primary)" : "inherit" }}>👍</span>
          <span>{post.reactionCount}</span>
        </button>
        <Link href={`/community/posts/${post.id}`} style={{ fontSize: "0.85rem", textDecoration: "none", color: "var(--color-text-muted)" }}>
          {post.commentCount} comments
        </Link>
        {post.viewCount > 0 && (
          <span className="mut" style={{ fontSize: "0.85rem" }}>👁 {post.viewCount}</span>
        )}
      </div>
    </Card>
  );
}
