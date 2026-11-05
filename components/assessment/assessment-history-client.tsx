"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import React from "react";
import { Button, Card, Badge, ProgressBar, EmptyState, Select } from "@/components/ui";

interface AssessmentHistoryProps {
  userId: string;
}

interface Attempt {
  id: string;
  status: string;
  assessment: {
    id: string;
    title: string;
    slug: string;
    type: string;
  };
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  passed: boolean | null;
  result?: {
    totalScore: number;
    maxScore: number;
    percentage: number;
    passed: boolean;
  } | null;
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    APTITUDE: "Aptitude",
    TECHNICAL: "Technical",
    CODING: "Coding",
    READINESS: "Interview Readiness",
    CUSTOM: "Custom",
  };
  return labels[type] || type;
};

const getStatusLabel = (status: string, result?: { passed: boolean | null } | null) => {
  switch (status) {
    case "COMPLETED": return result?.passed === true ? "Passed" : result?.passed === false ? "Failed" : "Completed";
    case "EVALUATING": return "Evaluating";
    case "EXPIRED": return "Expired";
    case "SUBMITTED": return "Submitted";
    case "IN_PROGRESS": return "In Progress";
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

export function AssessmentHistoryClient({ userId }: AssessmentHistoryProps) {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [filterStatus, setFilterStatus] = useState<string>("");

  const fetchAttempts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(pagination.page),
      pageSize: String(pagination.pageSize),
      ...(filterStatus && { status: filterStatus }),
    });
    try {
      const res = await fetch(`/api/assessments/history?${params}`);
      if (!res.ok) throw new Error("Failed to load history");
      const data = await res.json();
      setAttempts(data.attempts);
      setPagination((p) => ({ ...p, total: data.pagination.total, totalPages: data.pagination.totalPages }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, filterStatus]);

  useEffect(() => { fetchAttempts(); }, [fetchAttempts]);

  const getStatusBadge = (attempt: Attempt) => {
    const color = getStatusColor(attempt.status, attempt.result);
    return <Badge style={{ background: color }}>{getStatusLabel(attempt.status, attempt.result)}</Badge>;
  };

  if (loading && attempts.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
        <ProgressBar percent={50} />
      </div>
    );
  }

  return (
    <div>
      <Card style={{ marginBottom: 24, padding: 16 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <Select
            options={[
              { value: "", label: "All Statuses" },
              { value: "COMPLETED", label: "Completed" },
              { value: "EVALUATING", label: "Evaluating" },
              { value: "EXPIRED", label: "Expired" },
              { value: "IN_PROGRESS", label: "In Progress" },
            ]}
            value={filterStatus}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)}
            style={{ minWidth: 200 }}
          />
          <span className="mut">Showing {attempts.length} of {pagination.total} attempts</span>
        </div>
      </Card>

      {error && (
        <Card style={{ marginBottom: 16, padding: 16, background: "var(--color-error-bg)", borderColor: "var(--color-error)" }}>
          <div className="err">{error}</div>
        </Card>
      )}

      {attempts.length === 0 ? (
        <EmptyState>
          <h3>No assessment attempts yet</h3>
          <p>Start your first assessment from the <a href="/assessments">catalog</a> or <a href="/assessments/custom">create a custom one</a>.</p>
        </EmptyState>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {attempts.map((attempt) => {
              const timeSpent = attempt.submittedAt
                ? new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()
                : null;
              return (
                <Card key={attempt.id} style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <Link href={`/assessments/${attempt.assessment.slug}`} style={{ textDecoration: "none", color: "var(--color-primary)" }}>
                        <h3 style={{ marginBottom: 4 }}>{attempt.assessment.title}</h3>
                      </Link>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <Badge>{getTypeLabel(attempt.assessment.type)}</Badge>
                        {getStatusBadge(attempt)}
                        {attempt.result && (
                          <span style={{ fontWeight: 600, color: attempt.result.passed ? "var(--color-success)" : "var(--color-error)" }}>
                            {attempt.result.percentage?.toFixed(1) ?? 0}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <div className="mut" style={{ marginBottom: 4 }}>
                        {new Date(attempt.startedAt).toLocaleDateString()} at {new Date(attempt.startedAt).toLocaleTimeString()}
                      </div>
                      {timeSpent && <div className="mut">Duration: {formatTime(timeSpent)}</div>}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
                    <div>
                      <div className="mut" style={{ marginBottom: 4 }}>Score</div>
                      <div style={{ fontWeight: 600 }}>
                        {attempt.score !== null && attempt.maxScore !== null
                          ? `${attempt.score} / ${attempt.maxScore}`
                          : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="mut" style={{ marginBottom: 4 }}>Percentage</div>
                      <div style={{ fontWeight: 600, color: attempt.percentage !== null && attempt.percentage >= 60 ? "var(--color-success)" : "var(--color-error)" }}>
                        {attempt.percentage !== null ? `${attempt.percentage.toFixed(1)}%` : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="mut" style={{ marginBottom: 4 }}>Time Spent</div>
                      <div>{timeSpent ? formatTime(timeSpent) : "—"}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
                    <Link href={`/assessments/results/${attempt.id}`}>
                      <Button variant="outline" size="small">View Details</Button>
                    </Link>
                    {attempt.status === "IN_PROGRESS" && (
                      <Link href={`/assessments/${attempt.assessment.slug}/start?attemptId=${attempt.id}`}>
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
              <Button variant="outline" disabled={pagination.page === 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>Previous</Button>
              <span style={{ display: "flex", alignItems: "center", padding: "0 16px" }}>Page {pagination.page} of {pagination.totalPages}</span>
              <Button variant="outline" disabled={pagination.page === pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}