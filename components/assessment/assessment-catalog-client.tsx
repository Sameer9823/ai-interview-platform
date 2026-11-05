"use client";
import { useState, useEffect, useCallback } from "react";
import { Button, Card, Badge, EmptyState, ProgressBar, Input, Select } from "@/components/ui";

interface Assessment {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  careerStages: string[];
  timeLimitMinutes: number;
  passingScore: number;
  negativeMarking: boolean;
  maxAttempts: number;
  createdAt: string;
  _count: { questions: number; attempts: number };
}

interface Props {
  initialData: { careerStage?: string | null };
  assessmentTypes: readonly string[];
  difficulties: readonly string[];
  careerStages: readonly string[];
}

export function AssessmentCatalogClient({ initialData, assessmentTypes, difficulties, careerStages }: Props) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 12, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({
    type: "",
    difficulty: "",
    careerStage: initialData.careerStage || "",
    search: "",
  });

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(pagination.page),
      pageSize: String(pagination.pageSize),
      ...(filters.type && { type: filters.type }),
      ...(filters.difficulty && { difficulty: filters.difficulty }),
      ...(filters.careerStage && { careerStage: filters.careerStage }),
      ...(filters.search && { search: filters.search }),
    });
    try {
      const res = await fetch(`/api/assessments/list?${params}`);
      if (!res.ok) throw new Error("Failed to load assessments");
      const data = await res.json();
      setAssessments(data.assessments);
      setPagination((p) => ({ ...p, total: data.pagination.total, totalPages: data.pagination.totalPages }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load assessments");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, filters]);

  useEffect(() => { fetchAssessments(); }, [fetchAssessments]);

  const formatTime = (mins: number) => {
    if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    return `${mins}m`;
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "BEGINNER": return "var(--color-success)";
      case "INTERMEDIATE": return "var(--color-warning)";
      case "ADVANCED": return "var(--color-error)";
      default: return "var(--color-primary)";
    }
  };

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

  if (loading && assessments.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
        <ProgressBar percent={50} />
      </div>
    );
  }

  return (
    <div>
      <Card style={{ marginBottom: 24, padding: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 2fr", gap: 16, alignItems: "end" }}>
          <div>
            <Input
              placeholder="Search assessments..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
              onKeyDown={(e) => e.key === "Enter" && fetchAssessments()}
            />
          </div>
          <div>
            <Select
              options={[{ value: "", label: "All Types" }, ...assessmentTypes.map((t) => ({ value: t, label: getTypeLabel(t) }))]}
              value={filters.type}
              onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value, page: 1 }))}
            />
          </div>
          <div>
            <Select
              options={[{ value: "", label: "All Difficulties" }, ...difficulties.map((d) => ({ value: d, label: d }))]}
              value={filters.difficulty}
              onChange={(e) => setFilters((f) => ({ ...f, difficulty: e.target.value, page: 1 }))}
            />
          </div>
          <div>
            <Select
              options={[{ value: "", label: "All Career Stages" }, ...careerStages.map((c) => ({ value: c, label: c }))]}
              value={filters.careerStage}
              onChange={(e) => setFilters((f) => ({ ...f, careerStage: e.target.value, page: 1 }))}
            />
          </div>
        </div>
      </Card>

      {error && (
        <Card style={{ marginBottom: 16, padding: 16, background: "var(--color-error-bg)", borderColor: "var(--color-error)" }}>
          <div className="err">{error}</div>
        </Card>
      )}

      {assessments.length === 0 ? (
        <EmptyState>
          <h3>No assessments found</h3>
          <p>Try adjusting your filters or <a href="/assessments/custom">create a custom assessment</a>.</p>
        </EmptyState>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {assessments.map((a) => (
              <Card key={a.id} style={{ display: "flex", flexDirection: "column", transition: "transform 0.15s, box-shadow 0.15s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>{a.title}</h3>
                  <Badge style={{ background: getDifficultyColor(a.difficulty) }}>{a.difficulty}</Badge>
                </div>
                <p className="mut" style={{ marginBottom: 12, flex: 1 }}>{a.description || "No description provided."}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  <Badge>{getTypeLabel(a.type)}</Badge>
                  {a.careerStages.map((cs) => <Badge key={cs} style={{ background: "var(--color-info)" }}>{cs}</Badge>)}
                  {a.negativeMarking && <Badge style={{ background: "var(--color-warning)" }}>Negative Marking</Badge>}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
                  <div style={{ display: "flex", gap: 16, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                    <span>⏱ {formatTime(a.timeLimitMinutes)}</span>
                    <span>❓ {a._count.questions} questions</span>
                    <span>🎯 Pass: {a.passingScore}%</span>
                  </div>
                  <a href={`/assessments/${a.slug}`}>
                    <Button small variant="solid">View Details</Button>
                  </a>
                </div>
              </Card>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
              <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              >
                Previous
              </Button>
              <span style={{ display: "flex", alignItems: "center", padding: "0 16px" }}>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <Button
                variant="outline"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}