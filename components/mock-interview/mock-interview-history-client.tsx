"use client";
import React from "react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button, Card, Badge, ProgressBar, EmptyState } from "@/components/ui";

interface MockInterviewHistoryProps {
  userId: string;
}

interface Session {
  id: string;
  mode: string;
  targetRole: string | null;
  careerLevel: string | null;
  difficulty: string;
  interviewStyle: string;
  timeLimitMinutes: number;
  questionCount: number;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  passed: boolean | null;
  report: {
    overallScore: number | null;
    generatedAt: string;
  } | null;
  createdAt: string;
  _count: { questions: number; answers: number; evaluations: number };
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

const getStatusLabel = (status: string, result?: { passed: boolean | null } | null) => {
  switch (status) {
    case "COMPLETED": return result?.passed === true ? "Passed" : result?.passed === false ? "Failed" : "Completed";
    case "EVALUATING": return "Evaluating";
    case "EXPIRED": return "Expired";
    case "IN_PROGRESS": return "In Progress";
    case "READY": return "Ready";
    case "DRAFT": return "Draft";
    case "CANCELLED": return "Cancelled";
    default: return status;
  }
};

const getStatusColor = (status: string, result?: { passed: boolean | null } | null) => {
  switch (status) {
    case "COMPLETED": return result?.passed === true ? "var(--color-success)" : result?.passed === false ? "var(--color-error)" : "var(--color-primary)";
    case "EVALUATING": return "var(--color-info)";
    case "EXPIRED": return "var(--color-warning)";
    default: return "var(--color-text-muted)";
  }
};

const formatTime = (ms: number | null) => {
  if (!ms) return "N/A";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export function MockInterviewHistoryClient({ userId }: MockInterviewHistoryProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [filterStatus, setFilterStatus] = useState<string>("");

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(pagination.page),
      pageSize: String(pagination.pageSize),
      ...(filterStatus && { status: filterStatus }),
    });
    try {
      const res = await fetch(`/api/mock-interviews/history?${params}`);
      if (!res.ok) throw new Error("Failed to load history");
      const data = await res.json();
      setSessions(data.sessions);
      setPagination(p => ({ ...p, total: data.pagination.total, totalPages: data.pagination.totalPages }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, filterStatus]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

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

  const getStatusBadge = (session: Session) => {
    const color = getStatusColor(session.status, session.report ? { passed: session.report.overallScore !== null && session.report.overallScore >= 70 } : null);
    return React.createElement("span", { className: "badge", style: { background: color } }, getStatusLabel(session.status, session.report ? { passed: session.report.overallScore !== null && session.report.overallScore >= 70 } : null));
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();
  const formatTime = (ms: number | null) => {
    if (!ms) return "N/A";
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (loading && sessions.length === 0) {
    return React.createElement("div", { style: { display: "flex", justifyContent: "center", padding: "48px" } },
      React.createElement("div", { className: "bar", role: "progressbar", "aria-valuenow": 50, "aria-valuemin": 0, "aria-valuemax": 100 },
        React.createElement("i", { style: { width: "50%" } })
      )
    );
  }

  const getStatusColor = (status: string, result?: { passed: boolean | null } | null) => {
    switch (status) {
      case "COMPLETED": return result?.passed === true ? "var(--color-success)" : result?.passed === false ? "var(--color-error)" : "var(--color-primary)";
      case "EVALUATING": return "var(--color-info)";
      case "EXPIRED": return "var(--color-warning)";
      default: return "var(--color-text-muted)";
    }
  };

  const getStatusLabel = (status: string, result?: { passed: boolean | null } | null) => {
    switch (status) {
      case "COMPLETED": return result?.passed === true ? "Passed" : result?.passed === false ? "Failed" : "Completed";
      case "EVALUATING": return "Evaluating";
      case "EXPIRED": return "Expired";
      case "IN_PROGRESS": return "In Progress";
      case "READY": return "Ready";
      case "DRAFT": return "Draft";
      case "CANCELLED": return "Cancelled";
      default: return status;
    }
  };

  return (
    <div>
      <Card style={{ marginBottom: 24, padding: 16 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ minWidth: 180, padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--color-border)", background: "var(--color-background)" }}
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="EVALUATING">Evaluating</option>
            <option value="EXPIRED">Expired</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="READY">Ready</option>
            <option value="DRAFT">Draft</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <span className="mut">Showing {sessions.length} of {pagination.total} interviews</span>
        </div>
      </Card>

      {error && (
        <Card style={{ marginBottom: 16, padding: 16, background: "var(--color-error-bg)", borderColor: "var(--color-error)" }}>
          <div className="err">{error}</div>
        </Card>
      )}

      {sessions.length === 0 ? (
        <EmptyState>
          <h3>No interview sessions yet</h3>
          <p>Start your first mock interview from the <a href="/mock-interviews/new">interview dashboard</a>.</p>
        </EmptyState>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sessions.map((attempt) => {
              const timeSpent = attempt.completedAt && attempt.startedAt
                ? new Date(attempt.completedAt).getTime() - new Date(attempt.startedAt).getTime()
                : null;
              return (
                <Card key={attempt.id} style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <Link href={`/mock-interviews/${attempt.id}`} style={{ textDecoration: "none", color: "var(--color-primary)" }}>
                        <h3 style={{ marginBottom: 4 }}>{getModeLabel(attempt.mode)}</h3>
                      </Link>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <Badge>{getModeLabel(attempt.mode)}</Badge>
                        <Badge style={{ background: attempt.difficulty === "EASY" ? "var(--color-success)" : attempt.difficulty === "INTERMEDIATE" ? "var(--color-warning)" : "var(--color-error)" }}>{attempt.difficulty}</Badge>
                        {attempt.report && (
                          <span style={{ fontWeight: 600, color: attempt.report.overallScore !== null && attempt.report.overallScore >= 70 ? "var(--color-success)" : "var(--color-error)" }}>
                            {attempt.report.overallScore !== null ? `${attempt.report.overallScore}%` : "—"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <div className="mut" style={{ marginBottom: 4 }}>
                        {attempt.startedAt && new Date(attempt.startedAt).toLocaleDateString()} at {attempt.startedAt && new Date(attempt.startedAt).toLocaleTimeString()}
                      </div>
                      {timeSpent && <div className="mut">Duration: {formatTime(timeSpent)}</div>}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
                    <div>
                      <div className="mut" style={{ marginBottom: 4 }}>Score</div>
                      <div style={{ fontWeight: 600 }}>
                        {(attempt.report?.overallScore ?? null) !== null
                          ? `${attempt.report!.overallScore}%`
                          : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="mut" style={{ marginBottom: 4 }}>Duration</div>
                      <div>{timeSpent ? formatTime(timeSpent) : "—"}</div>
                    </div>
                    <div>
                      <div className="mut" style={{ marginBottom: 4 }}>Questions</div>
                      <div>{attempt._count?.answers || 0} / {attempt._count?.questions || 0}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
                    <Link href={`/mock-interviews/${attempt.id}`}>
                      <Button variant="outline" size="small">View Details</Button>
                    </Link>
                    {attempt.status === "IN_PROGRESS" && (
                      <Link href={`/mock-interviews/${attempt.id}`}>
                        <Button variant="solid" size="small">Continue</Button>
                      </Link>
                    )}
                    {attempt.status === "EVALUATING" && (
                      <Button variant="outline" size="small" onClick={() => window.location.reload()}>Refresh</Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {pagination.totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
              <Button variant="outline" disabled={pagination.page === 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>Previous</Button>
              <span style={{ display: "flex", alignItems: "center", padding: "0 16px" }}>Page {pagination.page} of {pagination.totalPages}</span>
              <Button variant="outline" disabled={pagination.page === pagination.totalPages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}