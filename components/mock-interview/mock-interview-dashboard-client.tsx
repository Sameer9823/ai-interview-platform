"use client";
import React from "react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button, Card, Badge, EmptyState, ProgressBar } from "@/components/ui";

interface MockInterview {
  id: string;
  mode: string;
  targetRole: string | null;
  careerLevel: string | null;
  difficulty: string;
  questionCount: number;
  durationMinutes: number;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  report: { overallScore: number | null; generatedAt: string } | null;
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
  return (
    <Badge style={{ background: colors[status] || "var(--color-primary)" }}>
      {labels[status] || status}
    </Badge>
  );
};

const getDifficultyBadge = (diff: string) => {
  const colors: Record<string, string> = {
    EASY: "var(--color-success)",
    MEDIUM: "var(--color-warning)",
    HARD: "var(--color-error)",
    ADAPTIVE: "var(--color-info)",
  };
  return <Badge style={{ background: colors[diff] || "var(--color-primary)" }}>{diff}</Badge>;
};

interface MockInterviewDashboardProps {
  initialData: {
    userId: string;
    careerStage?: string | null;
  };
}

export function MockInterviewDashboardClient({ initialData }: { initialData: { userId: string; careerStage?: string | null } }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ status: "", mode: "" });

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(pagination.page),
      pageSize: String(pagination.pageSize),
      ...(filters.status && { status: filters.status }),
      ...(filters.mode && { mode: filters.mode }),
    });
    try {
      const res = await fetch(`/api/mock-interviews/history?${params}`);
      if (!res.ok) throw new Error("Failed to load interviews");
      const data = await res.json();
      setSessions(data.sessions);
      setPagination(p => ({ ...p, total: data.pagination.total, totalPages: data.pagination.totalPages }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, filters]);

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
    return React.createElement("span", { className: "badge", style: { background: colors[status] || "var(--color-primary)" } }, labels[status] || status);
  };

  const getDifficultyBadge = (diff: string) => {
    const colors: Record<string, string> = {
      EASY: "var(--color-success)",
      MEDIUM: "var(--color-warning)",
      HARD: "var(--color-error)",
      ADAPTIVE: "var(--color-info)",
    };
    return React.createElement("span", { className: "badge", style: { background: colors[diff] || "var(--color-primary)" } }, diff);
  };

  const formatDate = (dateStr: string | null) => dateStr ? new Date(dateStr).toLocaleDateString() : "—";
  const formatTime = (mins: number) => mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;

  if (loading && sessions.length === 0) {
    return React.createElement("div", { style: { display: "flex", justifyContent: "center", padding: "48px" } },
      React.createElement("div", { className: "bar", role: "progressbar", "aria-valuenow": 50, "aria-valuemin": 0, "aria-valuemax": 100 },
        React.createElement("i", { style: { width: "50%" } })
      )
    );
  }

  return React.createElement("div", null,
    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 } },
      React.createElement("div", null,
        React.createElement("h1", null, "Mock Interviews"),
        React.createElement("p", { className: "mut", style: { marginTop: 8 } }, "Practice realistic interviews with AI-powered follow-ups and detailed feedback.")
      ),
      React.createElement("div", { style: { display: "flex", gap: 12 } },
        React.createElement(Link, { href: "/mock-interviews/new" },
          React.createElement("button", { className: "btn solid" }, "New Mock Interview")
        )
      )
    ),

    error && React.createElement("div", { className: "card", style: { marginBottom: 16, padding: 16, background: "var(--color-error-bg)", borderColor: "var(--color-error)" } },
      React.createElement("div", { className: "err" }, error)
    ),

    sessions.length === 0 ? React.createElement("div", { className: "empty", style: { padding: "48px 24px", textAlign: "center" } },
      React.createElement("h3", null, "No mock interviews yet"),
      React.createElement("p", { className: "mut", style: { marginTop: 8 } }, "Create your first mock interview to start practicing."),
      React.createElement(Link, { href: "/mock-interviews/new", style: { marginTop: 16, display: "inline-block" } },
        React.createElement("button", { className: "btn solid" }, "Create Your First Interview")
      )
    ) : React.createElement(React.Fragment, null,
      React.createElement("div", { className: "card", style: { marginBottom: 24, padding: 16 } },
        React.createElement("div", { style: { display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" } },
          React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 8, fontWeight: 500 } }, "Status:",
            React.createElement("select", {
              value: filters.status,
              onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setFilters(f => ({ ...f, status: e.target.value, page: 1 })),
              style: { minWidth: 150, padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--color-border)", background: "var(--color-background)" }
            },
              React.createElement("option", { value: "" }, "All Status"),
              React.createElement("option", { value: "DRAFT" }, "Draft"),
              React.createElement("option", { value: "READY" }, "Ready"),
              React.createElement("option", { value: "IN_PROGRESS" }, "In Progress"),
              React.createElement("option", { value: "COMPLETED" }, "Completed"),
              React.createElement("option", { value: "CANCELLED" }, "Cancelled"),
              React.createElement("option", { value: "EXPIRED" }, "Expired")
            )
          ),
          React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 8, fontWeight: 500 } }, "Mode:",
            React.createElement("select", {
              value: filters.mode,
              onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setFilters(f => ({ ...f, mode: e.target.value, page: 1 })),
              style: { minWidth: 200, padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--color-border)", background: "var(--color-background)" }
            },
              React.createElement("option", { value: "" }, "All Types"),
              React.createElement("option", { value: "HR_BEHAVIORAL" }, "HR & Behavioral"),
              React.createElement("option", { value: "TECHNICAL" }, "Technical"),
              React.createElement("option", { value: "CODING" }, "Coding"),
              React.createElement("option", { value: "SYSTEM_DESIGN" }, "System Design"),
              React.createElement("option", { value: "COMPANY_SPECIFIC" }, "Company-Specific"),
              React.createElement("option", { value: "RESUME_BASED" }, "Resume-Based"),
              React.createElement("option", { value: "JOB_DESCRIPTION_BASED" }, "JD-Based"),
              React.createElement("option", { value: "MIXED" }, "Mixed"),
              React.createElement("option", { value: "CUSTOM" }, "Custom"),
            )
          ),
          React.createElement("span", { className: "mut" }, `Showing ${sessions.length} of ${pagination.total} interviews`)
        )
      ),

      React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
        sessions.map((s: any) => React.createElement("div", { key: s.id, className: "card", style: { display: "flex", flexDirection: "column" } },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 12 } },
            React.createElement("div", { style: { flex: 1 } },
              React.createElement("h3", { style: { marginBottom: 4 } }, `Mock Interview #${s.id.slice(0, 8)}`),
              React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 4 } },
                React.createElement("span", { className: "badge" }, s.mode),
                React.createElement("span", { className: "badge", style: { background: s.difficulty === "EASY" ? "var(--color-success)" : s.difficulty === "MEDIUM" ? "var(--color-warning)" : s.difficulty === "HARD" ? "var(--color-error)" : "var(--color-info)" } }, s.difficulty),
                s.targetRole && React.createElement("span", { className: "mut" }, `→ ${s.targetRole}`),
                s.careerLevel && React.createElement("span", { className: "mut" }, `(${s.careerLevel})`)
              )
            ),
            React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 } },
              React.createElement("div", null, getStatusBadge(s.status)),
              React.createElement("div", { className: "mut", style: { fontSize: "0.85rem" } }, `Created ${new Date(s.createdAt).toLocaleDateString()}`)
            )
          ),
          React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, paddingTop: 12, borderTop: "1px solid var(--color-border)" } },
            React.createElement("div", null,
              React.createElement("div", { className: "mut", style: { marginBottom: 4 } }, "Questions"),
              React.createElement("div", { style: { fontWeight: 600 } }, `${s._count?.answers || 0} / ${s._count?.questions || 0}`)
            ),
            React.createElement("div", null,
              React.createElement("div", { className: "mut", style: { marginBottom: 4 } }, "Duration"),
              React.createElement("div", null, s.durationMinutes ? `${s.durationMinutes} min` : "—")
            ),
            React.createElement("div", null,
              React.createElement("div", { className: "mut", style: { marginBottom: 4 } }, "Score"),
              React.createElement("div", { style: { fontWeight: 600, color: s.report?.overallScore !== null && s.report?.overallScore !== undefined && s.report.overallScore >= 70 ? "var(--color-success)" : s.report?.overallScore !== null && s.report?.overallScore !== undefined ? "var(--color-error)" : "var(--color-text-muted)" } },
                s.report?.overallScore !== null && s.report?.overallScore !== undefined ? `${s.report.overallScore}%` : "—"
              )
            ),
            React.createElement("div", null,
              React.createElement("div", { className: "mut", style: { marginBottom: 4 } }, "Status"),
              React.createElement("div", null, s.completedAt ? "Completed" : s.startedAt ? "In Progress" : s.status === "READY" ? "Ready to Start" : s.status)
            )
          ),
          React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--color-border)" } },
            React.createElement("a", { href: `/mock-interviews/${s.id}` },
              React.createElement("button", { className: "btn outline", style: { flex: 1 } }, s.status === "IN_PROGRESS" ? "Continue" : s.status === "COMPLETED" ? "View Results" : "View Details")
            ),
            s.status === "IN_PROGRESS" && React.createElement("a", { href: `/mock-interviews/${s.id}` },
              React.createElement("button", { className: "btn solid", style: { flex: 1 } }, "Continue Interview")
            ),
            s.status === "COMPLETED" && React.createElement("a", { href: `/mock-interviews/${s.id}/results` },
              React.createElement("button", { className: "btn outline", style: { flex: 1 } }, "View Report")
            )
          )
        ))
      ),

      pagination.totalPages > 1 && React.createElement("div", { style: { display: "flex", justifyContent: "center", gap: 8, marginTop: 24 } },
        React.createElement("button", { className: "btn outline", disabled: pagination.page === 1, onClick: () => setPagination(p => ({ ...p, page: p.page - 1 })) }, "Previous"),
        React.createElement("span", { style: { display: "flex", alignItems: "center", padding: "0 16px" } }, `Page ${pagination.page} of ${pagination.totalPages}`),
        React.createElement("button", { className: "btn outline", disabled: pagination.page === pagination.totalPages, onClick: () => setPagination(p => ({ ...p, page: p.page + 1 })) }, "Next")
      )
    )
  );
}