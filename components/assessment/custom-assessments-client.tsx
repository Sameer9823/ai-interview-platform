"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button, Card, Badge, EmptyState, ProgressBar, Input, Select, Textarea } from "@/components/ui";

interface CustomAssessment {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  timeLimitMinutes: number;
  passingScore: number;
  createdAt: string;
  _count: { questions: number; attempts: number };
}

interface QuestionTypeOption {
  value: string;
  label: string;
}

const QUESTION_TYPES: QuestionTypeOption[] = [
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "SINGLE_ANSWER", label: "Single Answer" },
  { value: "SHORT_ANSWER", label: "Short Answer" },
  { value: "LONG_ANSWER", label: "Long Answer" },
  { value: "CODING", label: "Coding" },
  { value: "SQL", label: "SQL" },
  { value: "SCENARIO", label: "Scenario" },
  { value: "BEHAVIORAL", label: "Behavioral" },
  { value: "SYSTEM_DESIGN", label: "System Design" },
  { value: "COMMUNICATION", label: "Communication" },
];

const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

interface CustomAssessmentsProps {
  userId: string;
  careerStage?: string | null;
}

export function CustomAssessmentsClient({ userId, careerStage }: CustomAssessmentsProps) {
  const [assessments, setAssessments] = useState<CustomAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    difficulty: "" as string,
    questionTypes: [] as string[],
    questionCount: 10,
    timeLimitMinutes: 30,
    passingScore: 60,
    negativeMarking: false,
  });

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/assessments/custom?page=${pagination.page}&pageSize=${pagination.pageSize}`);
      if (!res.ok) throw new Error("Failed to load custom assessments");
      const data = await res.json();
      setAssessments(data.assessments);
      setPagination((p) => ({ ...p, total: data.pagination.total, totalPages: data.pagination.totalPages }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize]);

  useEffect(() => { fetchAssessments(); }, [fetchAssessments]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/assessments/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to create" }));
        throw new Error(err.error || "Failed to create assessment");
      }
      const data = await res.json();
      setShowCreate(false);
      setForm({
        title: "", description: "", difficulty: "", questionTypes: [],
        questionCount: 10, timeLimitMinutes: 30, passingScore: 60, negativeMarking: false,
      });
      fetchAssessments();
      window.location.href = `/assessments/${data.assessment.slug}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  if (loading && assessments.length === 0) {
    return <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}><ProgressBar percent={50} /></div>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2>Your Custom Assessments</h2>
        <Button variant="solid" onClick={() => setShowCreate(true)}>Create New</Button>
      </div>

      {showCreate && (
        <Card style={{ marginBottom: 24, padding: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Create Custom Assessment</h3>
          {error && <div className="err" style={{ marginBottom: 16 }}>{error}</div>}
          <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Input
                id="title"
                label="Title *"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g., JavaScript Fundamentals Practice"
                required
              />
            </div>
            <div>
              <Select
                id="difficulty"
                label="Difficulty"
                options={{ "": "Any", BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced" }}
                value={form.difficulty}
                onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Textarea
                id="description"
                label="Description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of what this assessment covers"
                rows={3}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Question Types</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {QUESTION_TYPES.map((qt) => (
                  <label key={qt.value} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", border: "1px solid var(--color-border)", borderRadius: "6px", cursor: "pointer", background: form.questionTypes.includes(qt.value) ? "var(--color-brand-bg)" : "transparent" }}>
                    <input
                      type="checkbox"
                      checked={form.questionTypes.includes(qt.value)}
                      onChange={(e) => setForm((f) => ({ ...f, questionTypes: e.target.checked ? [...f.questionTypes, qt.value] : f.questionTypes.filter((v) => v !== qt.value) }))}
                    />
                    {qt.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Input
                type="number"
                id="questionCount"
                label="Question Count"
                value={form.questionCount}
                onChange={(e) => setForm((f) => ({ ...f, questionCount: parseInt(e.target.value) || 10 }))}
                min={1}
                max={50}
              />
            </div>
            <div>
              <Input
                type="number"
                id="timeLimitMinutes"
                label="Time Limit (minutes)"
                value={form.timeLimitMinutes}
                onChange={(e) => setForm((f) => ({ ...f, timeLimitMinutes: parseInt(e.target.value) || 30 }))}
                min={5}
                max={180}
              />
            </div>
            <div>
              <Input
                type="number"
                id="passingScore"
                label="Passing Score (%)"
                value={form.passingScore}
                onChange={(e) => setForm((f) => ({ ...f, passingScore: parseInt(e.target.value) || 60 }))}
                min={0}
                max={100}
              />
            </div>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={form.negativeMarking}
                  onChange={(e) => setForm((f) => ({ ...f, negativeMarking: e.target.checked }))}
                />
                Enable negative marking
              </label>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8, gridColumn: "1 / -1" }}>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" variant="solid" disabled={creating || !form.title}>
                {creating ? "Creating..." : "Create Assessment"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {error && !showCreate && (
        <Card style={{ marginBottom: 16, padding: 16, background: "var(--color-error-bg)", borderColor: "var(--color-error)" }}>
          <div className="err">{error}</div>
        </Card>
      )}

      {assessments.length === 0 && !showCreate ? (
        <EmptyState>
          <h3>No custom assessments yet</h3>
          <p>Click "Create New" to build your first personalized practice test.</p>
        </EmptyState>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {assessments.map((a) => (
              <Card key={a.id} style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <h3 style={{ fontSize: "1.1rem" }}>{a.title}</h3>
                  <Badge style={{ background: a.difficulty === "BEGINNER" ? "var(--color-success)" : a.difficulty === "INTERMEDIATE" ? "var(--color-warning)" : "var(--color-error)" }}>{a.difficulty}</Badge>
                </div>
                <p className="mut" style={{ marginBottom: 12, flex: 1 }}>{a.description || "No description"}</p>
                <div style={{ display: "flex", gap: 8, marginBottom: 12, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  <span>⏱ {a.timeLimitMinutes}m</span>
                  <span>❓ {a._count.questions} questions</span>
                  <span>🎯 Pass: {a.passingScore}%</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
                  <Link href={`/assessments/${a.slug}`}>
                    <Button variant="outline" size="small" style={{ flex: 1 }}>View Details</Button>
                  </Link>
                  <a href={`/assessments/${a.slug}`}>
                    <Button variant="solid" size="small" style={{ flex: 1 }}>Start Assessment</Button>
                  </a>
                </div>
              </Card>
            ))}
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