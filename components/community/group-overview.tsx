"use client";
import { useState, useEffect, useCallback } from "react";
import { Button, Card, Badge } from "@/components/ui";
import Link from "next/link";

interface Member {
  id: string;
  userId: string;
  name: string;
  role: string;
  joinedAt: string;
}

interface Discussion {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  author: { id: string; name: string };
  _count: { replies: number };
}

interface Resource {
  id: string;
  title: string;
  url: string;
  type: string;
  description: string | null;
  uploadedBy: { id: string; name: string };
  createdAt: string;
}

interface Session {
  id: string;
  topic: string;
  description: string | null;
  scheduledAt: string;
  duration: number;
  host: { id: string; name: string };
  _count: { attendances: number };
}

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: string;
  xpReward: number;
  _count: { participations: number };
}

interface GroupOverviewProps {
  group: {
    id: string;
    name: string;
    description: string;
    about: string | null;
    category: string;
    targetRole: string | null;
    targetCompany: string | null;
    skill: string | null;
    careerStage: string | null;
    maxMembers: number;
    visibility: string;
    rules: string[] | null;
    imageUrl: string | null;
    memberCount: number;
    createdAt: string | Date;
    updatedAt: string | Date;
  };
  userRole: "OWNER" | "ADMIN" | "MODERATOR" | "MEMBER" | null;
  counts: { memberships: number; discussions: number; resources: number; sessions: number; challenges: number };
  userId: string;
}

const TABS = ["discussions", "resources", "sessions", "challenges", "members"] as const;

export function GroupOverview({ group, userRole, counts, userId }: GroupOverviewProps) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("discussions");
  const [data, setData] = useState<{
    discussions: Discussion[];
    resources: Resource[];
    sessions: Session[];
    challenges: Challenge[];
    members: Member[];
  }>({ discussions: [], resources: [], sessions: [], challenges: [], members: [] });
  const [loading, setLoading] = useState(false);

  const loadTabData = useCallback(async (tab: (typeof TABS)[number]) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/community/groups/${group.id}/${tab}`);
      if (!res.ok) throw new Error("Failed to load data");
      const result = await res.json();
      setData((prev) => ({ ...prev, [tab]: result[tab] || result || [] }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [group.id]);

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab, loadTabData]);

  const isModerator = userRole === "OWNER" || userRole === "ADMIN" || userRole === "MODERATOR";
  const canManage = userRole === "OWNER" || userRole === "ADMIN";

  const roleColor = userRole === "OWNER" ? "var(--color-warning)" : userRole === "ADMIN" ? "var(--color-info)" : userRole === "MODERATOR" ? "var(--color-success)" : "var(--color-text-muted)";

  return (
    <div>
      <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
        {group.imageUrl && <img src={group.imageUrl} alt={group.name} style={{ width: 80, height: 80, borderRadius: 8, objectFit: "cover" }} />}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <h1 style={{ margin: 0, fontSize: "1.5rem" }}>{group.name}</h1>
            <Badge style={{ background: roleColor, color: "white", fontSize: "0.75rem" }}>{group.category}</Badge>
            {group.visibility === "PRIVATE" && <Badge>Private</Badge>}
          </div>
          <p className="mut" style={{ margin: "0 0 8px" }}>{group.description}</p>
          <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: "0.85rem" }}>
            <span>👥 {group.memberCount} members</span>
            <span>📅 Created {new Date(group.createdAt).toLocaleDateString()}</span>
            {group.skill && <span>🎯 {group.skill}</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    {userRole ? (
            <Link href={`/study-groups/${group.id}/${activeTab}`}>
              <Button variant="solid" size="small">
                {activeTab === "discussions" ? "New Discussion" : activeTab === "resources" ? "Add Resource" : activeTab === "sessions" ? "New Session" : "New Challenge"}
              </Button>
            </Link>
          ) : (
            <Button variant="solid" size="small" onClick={() => window.location.href = `/api/community/groups/${group.id}/join`}>Join Group</Button>
          )}
        </div>
      </div>

      <Card style={{ padding: 0, marginBottom: 24 }}>
        <nav style={{ display: "flex", borderBottom: "1px solid var(--color-border)" }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "12px 20px",
                border: "none",
                background: "none",
                cursor: "pointer",
                borderBottom: activeTab === tab ? "2px solid var(--color-primary)" : "2px solid transparent",
                fontWeight: activeTab === tab ? 600 : 400,
                fontSize: "0.9rem",
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({counts[tab as keyof typeof counts]})
            </button>
          ))}
        </nav>
      </Card>

      {loading ? (
        <Card style={{ padding: 24, textAlign: "center" }}>
          <p className="mut">Loading...</p>
        </Card>
      ) : (
        <TabContent tab={activeTab} items={data[activeTab]} group={group} userId={userId} />
      )}
    </div>
  );
}

function TabContent({ tab, items, group, userId }: { tab: (typeof TABS)[number]; items: any[]; group: { id: string; rules: string[] | null }; userId: string }) {
  if (tab === "members") {
    const members = items as Member[];
    return (
      <Card style={{ padding: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {members.map((m) => (
            <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontWeight: 600 }}>{m.name}</span>
                <Badge style={{ background: roleColorMap(m.role), color: "white", fontSize: "0.75rem" }}>{m.role}</Badge>
              </div>
              <span className="mut" style={{ fontSize: "0.8rem" }}>Joined {new Date(m.joinedAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ padding: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {items.length === 0 ? (
          <p className="mut">No {tab} yet.</p>
        ) : (
          items.map((item: any) => (
            <div key={item.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontWeight: 600 }}>{item.title || item.topic || "Item"}</h3>
                {item.createdAt && <span className="mut" style={{ fontSize: "0.8rem" }}>{formatDate(item.createdAt)}</span>}
              </div>
              {item.description || item.content ? (
                <p className="mut" style={{ margin: "4px 0 8px", fontSize: "0.9rem" }}>{(item.description || item.content).substring(0, 200)}...</p>
              ) : null}
              {item._count && Object.keys(item._count).length > 0 && (
                <div style={{ display: "flex", gap: 16, fontSize: "0.8rem" }}>
                  {Object.entries(item._count).map(([key, val]) => (
                    <span key={key} className="mut">{key}: {(val as number)}</span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function roleColorMap(role: string): string {
  const map: Record<string, string> = {
    OWNER: "var(--color-warning)",
    ADMIN: "var(--color-info)",
    MODERATOR: "var(--color-success)",
    MEMBER: "var(--color-text-muted)",
  };
  return map[role] || "var(--color-text-muted)";
}

function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString();
}
