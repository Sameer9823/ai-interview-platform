"use client";
import { Card, Badge, Button, EmptyState } from "@/components/ui";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  description: string;
  topic: { id: string; name: string; slug: string; color: string | null; icon: string | null };
  author: { id: string; name: string };
  question: { id: string; slug: string; text: string; difficulty: string; type: string; category: { name: string } } | null;
  visibility: string;
  imageUrl: string | null;
  resourceUrl: string | null;
  viewCount: number;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
  reactionCount: number;
  userReactions: string[];
  isSaved: boolean;
  comments: Array<{
    id: string;
    content: string;
    author: { id: string; name: string };
    createdAt: string;
    replies: Array<{
      id: string;
      content: string;
      author: { id: string; name: string };
      createdAt: string;
    }>;
  }>;
}

interface CommentInputProps {
  postId: string;
  parentId?: string;
   onCommentAdded?: (reply?: any) => void;
  onCancel?: () => void;
}

function CommentInput({ postId, parentId, onCommentAdded, onCancel }: CommentInputProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await fetch("/api/community/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "comment",
          postId,
          parentId: parentId || undefined,
          content: content.trim(),
        }),
      });
      setContent("");
      onCommentAdded?.();
      onCancel?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 12 }}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentId ? "Write a reply..." : "Write a comment..."}
        rows={3}
        maxLength={2000}
        required
        style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--color-border)", borderRadius: "6px", fontFamily: "inherit" }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <Button type="submit" variant="solid" size="small" disabled={submitting || !content.trim()}>
          {submitting ? "Posting..." : "Post"}
        </Button>
        {onCancel && <Button type="button" variant="outline" size="small" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}

import { useState, useCallback } from "react";

export function CommunityPostDetail({ post, userId }: { post: Post; userId: string }) {
  const [currentPost, setCurrentPost] = useState<Post>(post);
  const [reacting, setReacting] = useState(false);

  const handleReact = useCallback(async (reaction: string) => {
    setReacting(true);
    try {
      await fetch("/api/community/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "react", postId: post.id, reaction }),
      });
      setCurrentPost((p) => {
        const hasReaction = p.userReactions.includes(reaction);
        const userReactions = hasReaction
          ? p.userReactions.filter((r: string) => r !== reaction)
          : [...p.userReactions, reaction];
        return {
          ...p,
          reactionCount: userReactions.length,
          userReactions,
        };
      });
    } finally {
      setReacting(false);
    }
  }, [post]);

  const handleSave = useCallback(async () => {
    await fetch("/api/community/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save", postId: post.id }),
    });
    setCurrentPost((p) => ({ ...p, isSaved: !p.isSaved }));
  }, [post]);

  const handleComment = (reply: Post["comments"][number]) => {
    setCurrentPost((p) => ({
      ...p,
      comments: [...p.comments, reply],
      commentCount: p.commentCount + 1,
    }));
  };

  const handleReply = (commentId: string, reply: any) => {
    setCurrentPost((p) => ({
      ...p,
      comments: p.comments.map((c) =>
        c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c
      ),
    }));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontWeight: 600 }}>{currentPost.author.name}</span>
            {currentPost.topic && (
              <>
                <span className="mut">·</span>
                <Badge style={{ background: currentPost.topic.color || "var(--color-primary-bg)" }}>{currentPost.topic.name}</Badge>
              </>
            )}
            <span className="mut" style={{ fontSize: "0.85rem" }}>{new Date(currentPost.createdAt).toLocaleDateString()}</span>
          </div>
          <h1 style={{ margin: "0 0 12px", fontSize: "1.5rem" }}>{currentPost.title}</h1>
        </div>
        <Button variant={currentPost.isSaved ? "solid" : "outline"} size="small" onClick={handleSave}>
          {currentPost.isSaved ? "★ Saved" : "☆ Save"}
        </Button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <p style={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{currentPost.description}</p>

        {currentPost.resourceUrl && (
          <Card style={{ padding: 12, marginTop: 16, background: "var(--color-surface)" }}>
            <a href={currentPost.resourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-primary)", textDecoration: "none" }}>
              🔗 {currentPost.resourceUrl}
            </a>
          </Card>
        )}
      </div>

      <div style={{ display: "flex", gap: 16, paddingTop: 12, borderTop: "1px solid var(--color-border)", marginBottom: 24 }}>
        <button onClick={() => handleReact("LIKE")} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer" }}>
          <span>👍</span> <span>{currentPost.reactionCount}</span>
        </button>
        <span className="mut">{currentPost.commentCount} comments</span>
      </div>

      <div style={{ marginBottom: 32 }}>
        <h3 style={{ marginBottom: 16 }}>Comments</h3>
        <CommentInput postId={currentPost.id} onCommentAdded={() => {}} />
        {currentPost.comments.length === 0 ? (
          <EmptyState>
            <p>No comments yet. Be the first to comment!</p>
          </EmptyState>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {currentPost.comments.map((comment) => (
              <Comment key={comment.id} comment={comment} postId={currentPost.id} onReply={handleReply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface CommentProps {
  comment: Post["comments"][number];
  postId: string;
  onReply: (commentId: string, reply: any) => void;
}

function Comment({ comment, postId, onReply }: CommentProps) {
  const [showReply, setShowReply] = useState(false);

  const handleReplyAdded = (reply: any) => {
    onReply(comment.id, reply);
    setShowReply(false);
  };

  return (
    <div style={{ padding: "12px 0", borderBottom: "1px solid var(--color-border)" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{comment.author.name}</span>
        <span className="mut" style={{ fontSize: "0.8rem" }}>{new Date(comment.createdAt).toLocaleDateString()}</span>
      </div>
      <p style={{ margin: "0 0 8px", lineHeight: 1.5 }}>{comment.content}</p>
      <button
        onClick={() => setShowReply(!showReply)}
        style={{ background: "none", border: "none", color: "var(--color-primary)", cursor: "pointer", fontSize: "0.85rem" }}
      >
        Reply
      </button>

      {showReply && (
        <div style={{ marginTop: 12, marginLeft: 24 }}>
          <CommentInput postId={postId} parentId={comment.id} onCommentAdded={handleReplyAdded} onCancel={() => setShowReply(false)} />
        </div>
      )}

      {comment.replies.length > 0 && (
        <div style={{ marginTop: 12, marginLeft: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          {comment.replies.map((reply) => (
            <div key={reply.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{reply.author.name}</span>
                <span className="mut" style={{ fontSize: "0.75rem" }}>{new Date(reply.createdAt).toLocaleDateString()}</span>
              </div>
              <p style={{ margin: 0, lineHeight: 1.5, fontSize: "0.9rem" }}>{reply.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
