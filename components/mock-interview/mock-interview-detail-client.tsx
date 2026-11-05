"use client";
import React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Card, Badge, EmptyState, ProgressBar } from "@/components/ui";

interface MockInterviewDetailProps {
  sessionId: string;
  userId: string;
}

interface Session {
  id: string;
  mode: string;
  targetRole: string | null;
  careerLevel: string | null;
  difficulty: string;
  interviewStyle: string;
  feedbackMode: string;
  timeLimitMinutes: number;
  questionCount: number;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  questions: {
    id: string;
    sequenceNumber: number;
    turnType: string;
    questionType: string;
    questionText: string;
    topicTags: string[];
    difficulty: string;
    sourceType: string;
    sourceReference: string | null;
  }[];
  _count: { questions: number; answers: number; evaluations: number };
  report: {
    overallScore: number | null;
    generatedAt: string;
  } | null;
}

const getModeLabel = (mode: string) => {
  const labels: Record<string, string> = {
    HR_BEHAVIORAL: "HR & Behavioral",
    TECHNICAL: "Technical",
    CODING: "Coding",
    SYSTEM_DESIGN: "System Design",
    COMPANY_SPECIFIC: "Company-Specific",
    RESUME_BASED: "Resume-Based",
    JOB_DESCRIPTION_BASED: "JD-Based",
    MIXED: "Mixed",
    CUSTOM: "Custom",
  };
  return labels[mode] || mode;
};

const getDifficultyColor = (diff: string) => {
  const colors: Record<string, string> = {
    EASY: "var(--color-success)",
    MEDIUM: "var(--color-warning)",
    HARD: "var(--color-error)",
    ADAPTIVE: "var(--color-info)",
  };
  return <Badge style={{ background: colors[diff] || "var(--color-primary)" }}>{diff}</Badge>;
};

const getStatusBadge = (status: string) => {
  const colors: Record<string, string> = {
    DRAFT: "var(--color-text-muted)",
    READY: "var(--color-primary)",
    IN_PROGRESS: "var(--color-warning)",
    COMPLETED: "var(--color-success)",
    CANCELLED: "var(--color-text-muted)",
    EXPIRED: "var(--color-error)",
  };
  const labels: Record<string, string> = {
    DRAFT: "Draft",
    READY: "Ready",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    EXPIRED: "Expired",
  };
  return <Badge style={{ background: colors[status] || "var(--color-primary)" }}>{labels[status] || status}</Badge>;
};

const formatTime = (mins: number) => {
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `${mins}m`;
};

export function MockInterviewDetailClient({ sessionId, userId }: { sessionId: string; userId: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/mock-interviews/${sessionId}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Session not found");
          throw new Error("Failed to load session");
        }
        const data = await res.json();
        setSession(data.mockInterview);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load session");
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [sessionId]);

  const handleStart = async () => {
    if (!session) return;
    setStarting(true);
    try {
      const res = await fetch("/api/mock-interviews/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to start" }));
        throw new Error(err.error || "Failed to start interview");
      }
      const { session: startedSession } = await res.json();
      window.location.href = `/mock-interviews/${session.id}?started=true`;
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to start interview");
    } finally {
      setStarting(false);
    }
  };

  const handleContinue = () => {
    if (!session) return;
    window.location.href = `/mock-interviews/${session.id}`;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
        <ProgressBar percent={50} />
      </div>
    );
  }

  if (error) {
    return (
      <Card style={{ padding: 24, textAlign: "center", background: "var(--color-error-bg)", borderColor: "var(--color-error)" }}>
        <h2>Unable to Load Interview</h2>
        <p className="err">{error}</p>
        <Link href="/mock-interviews" style={{ marginTop: 16, display: "inline-block" }}>
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </Card>
    );
  }

  if (!session) return null;

  const getModeLabel = (mode: string) => {
    const labels: Record<string, string> = {
      HR_BEHAVIORAL: "HR & Behavioral",
      TECHNICAL: "Technical",
      CODING: "Coding",
      SYSTEM_DESIGN: "System Design",
      COMPANY_SPECIFIC: "Company-Specific",
      RESUME_BASED: "Resume-Based",
      JOB_DESCRIPTION_BASED: "JD-Based",
      MIXED: "Mixed",
      CUSTOM: "Custom",
    };
    return labels[mode] || mode;
  };

  const getDifficultyColor = (diff: string) => {
    const colors: Record<string, string> = {
      EASY: "var(--color-success)",
      MEDIUM: "var(--color-warning)",
      HARD: "var(--color-error)",
      ADAPTIVE: "var(--color-info)",
    };
    return <Badge style={{ background: colors[diff] || "var(--color-primary)" }}>{diff}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "var(--color-text-muted)",
      READY: "var(--color-primary)",
      IN_PROGRESS: "var(--color-warning)",
      COMPLETED: "var(--color-success)",
      CANCELLED: "var(--color-text-muted)",
      EXPIRED: "var(--color-error)",
    };
    const labels: Record<string, string> = {
      DRAFT: "Draft",
      READY: "Ready",
      IN_PROGRESS: "In Progress",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
      EXPIRED: "Expired",
    };
    return <Badge style={{ background: colors[status] || "var(--color-primary)" }}>{labels[status] || status}</Badge>;
  };

  const formatTime = (mins: number) => {
    if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
        <ProgressBar percent={50} />
      </div>
    );
  }

  if (error) {
    return (
      <Card style={{ padding: 24, textAlign: "center", background: "var(--color-error-bg)", borderColor: "var(--color-error)" }}>
        <h2>Unable to Load Interview</h2>
        <p className="err">{error}</p>
        <Link href="/mock-interviews" style={{ marginTop: 16, display: "inline-block" }}>
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </Card>
    );
  }

  if (!session) return null;

  const totalQuestions = session.questions.length;
  const totalMarks = session.questions.reduce((sum, q) => sum + 1, 0);
  const estimatedTime = session.questions.reduce((sum, q) => sum + 5, 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <Link href="/mock-interviews" style={{ textDecoration: "none", color: "var(--color-primary)", marginBottom: 8, display: "inline-block" }}>
            ← Back to Dashboard
          </Link>
          <h1>Mock Interview Session</h1>
          <p className="mut" style={{ marginTop: 8, maxWidth: "42.5rem" }}>
            Session ID: {session.id.slice(0, 8)}... · Created {new Date(session.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <Card style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Interview Overview</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div className="mut" style={{ fontSize: "0.85rem", marginBottom: 4 }}>Mode</div>
              <Badge>{session.mode}</Badge>
            </div>
            <div>
              <div className="mut" style={{ fontSize: "0.85rem", marginBottom: 4 }}>Difficulty</div>
              {session.difficulty && <span style={{ fontWeight: 500 }}>{session.difficulty}</span>}
            </div>
            <div>
              <div className="mut" style={{ fontSize: "0.85rem", marginBottom: 4 }}>Interview Style</div>
              <div style={{ fontWeight: 500 }}>{session.interviewStyle}</div>
            </div>
            <div>
              <div className="mut" style={{ fontSize: "0.85rem", marginBottom: 4 }}>Feedback Mode</div>
              <div style={{ fontWeight: 500 }}>{session.feedbackMode === "AFTER_EACH" ? "After Each" : "At End"}</div>
            </div>
            <div>
              <div className="mut" style={{ fontSize: "0.85rem", marginBottom: 4 }}>Time Limit</div>
              <div style={{ fontWeight: 500 }}>{formatTime(session.timeLimitMinutes)}</div>
            </div>
            <div>
              <div className="mut" style={{ fontSize: "0.85rem", marginBottom: 4 }}>Questions</div>
              <div style={{ fontWeight: 500 }}>{totalQuestions} ({totalMarks} marks)</div>
            </div>
            <div>
              <div className="mut" style={{ fontSize: "0.85rem", marginBottom: 4 }}>Est. Time</div>
              <div style={{ fontWeight: 500 }}>{formatTime(estimatedTime)}</div>
            </div>
            <div>
              <div className="mut" style={{ fontSize: "0.85rem", marginBottom: 4 }}>Status</div>
              <div>{getStatusBadge(session.status)}</div>
            </div>
          </div>
        </Card>

        <Card style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Questions</h3>
          {session.questions.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {session.questions.map((q) => (
                <div key={q.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "var(--color-surface)", borderRadius: "8px" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1 }}>
                    <span style={{ fontWeight: 500 }}>Q{q.sequenceNumber}</span>
                    <Badge style={{ background: q.difficulty === "BEGINNER" ? "var(--color-success)" : q.difficulty === "INTERMEDIATE" ? "var(--color-warning)" : "var(--color-error)" }}>{q.difficulty}</Badge>
                    <Badge>{q.questionType}</Badge>
                    <span className="mut" style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.questionText}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="mut">Turn: {q.turnType}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mut">No questions generated yet. Start the interview to generate questions.</p>
          )}
        </Card>
      </div>

      <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
        <Link href="/mock-interviews/history">
          <Button variant="outline">View History</Button>
        </Link>
        {session.status === "READY" || session.status === "DRAFT" ? (
          <Button variant="solid" size="large" onClick={handleStart} disabled={starting}>
            {starting ? "Starting..." : "Start Interview"}
          </Button>
        ) : session.status === "IN_PROGRESS" ? (
          <Link href={`/mock-interviews/${session.id}`}>
            <Button variant="solid" size="large">Continue Interview</Button>
          </Link>
        ) : session.status === "COMPLETED" ? (
          <Link href={`/mock-interviews/${session.id}/results`}>
            <Button variant="solid" size="large">View Results</Button>
          </Link>
        ) : (
          <Button variant="outline" disabled>Cannot Start</Button>
        )}
      </div>
    </div>
  );
}

