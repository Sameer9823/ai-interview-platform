"use client";
import { useState } from "react";
import { Button, Input, Textarea, Select, Badge, Card } from "@/components/ui";
import Link from "next/link";

interface CommunityPostFormProps {
  userId: string;
  onClose: () => void;
  onCreated: () => void;
}

interface Topic {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  icon: string | null;
}

export function CommunityPostForm({ userId, onClose, onCreated }: CommunityPostFormProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topicId, setTopicId] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [imageUrl, setImageUrl] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTopics = async () => {
    if (topics.length === 0) {
      const res = await fetch("/api/community/topics");
      if (res.ok) {
        const data = await res.json();
        setTopics(data.topics);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          topicId,
          visibility,
          imageUrl: imageUrl || undefined,
          resourceUrl: resourceUrl || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create post");
      }

      setTitle("");
      setDescription("");
      setTopicId("");
      setVisibility("PUBLIC");
      setImageUrl("");
      setResourceUrl("");
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card style={{ marginBottom: 24, padding: 24 }}>
      <h2 style={{ marginTop: 0, marginBottom: 16 }}>Create Post</h2>
      {error && <div className="err" style={{ marginBottom: 16 }}>{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Title *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What do you want to discuss?"
            maxLength={200}
            required
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Description *</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Share your thoughts, questions, or resources..."
            rows={6}
            maxLength={10000}
            required
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Topic *</label>
          <Select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            options={topics.map((t) => ({ value: t.id, label: t.name }))}
            onFocus={loadTopics}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Visibility</label>
            <Select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "PRIVATE")}
              options={[
                { value: "PUBLIC", label: "Public" },
                { value: "PRIVATE", label: "Private" },
              ]}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Resource URL</label>
            <Input
              value={resourceUrl}
              onChange={(e) => setResourceUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" variant="solid" disabled={submitting || !title || !description || !topicId}>
            {submitting ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
