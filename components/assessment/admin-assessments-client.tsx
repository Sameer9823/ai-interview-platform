"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button, Card, Badge, EmptyState, ProgressBar, TextField, SelectField, TextAreaField } from "@/components/ui";

interface Assessment {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  careerStages: string[];
  status: string;
  timeLimitMinutes: number;
  passingScore: number;
  negativeMarking: boolean;
  allowBackNavigation: boolean;
  showExplanationsAfter: boolean;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  _count: { questions: number; attempts: number };
  sections: { id: string; title: string; position: number; questionCount: number }[];
}

const ASSESSMENT_TYPES = ["APTITUDE", "TECHNICAL", "CODING", "READINESS"] as const;
const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
const CAREER_STAGES = ["STUDENT", "FRESHER", "PROFESSIONAL"] as const;
const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export function AdminAssessmentsClient() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ status: "", type: "" });
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Assessment | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "APTITUDE" as string,
    difficulty: "BEGINNER" as string,
    careerStages: [] as string[],
    timeLimitMinutes: 30,
    passingScore: 60,
    negativeMarking: false,
    allowBackNavigation: true,
    showExplanationsAfter: true,
    maxAttempts: 0,
    status: "DRAFT" as string,
  });

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(pagination.page),
      pageSize: String(pagination.pageSize),
      ...(filters.status && { status: filters.status }),
      ...(filters.type && { type: filters.type }),
    });
    try {
      const res = await fetch(`/api/admin/assessments?${params}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setAssessments(data.assessments);
      setPagination((p) => ({ ...p, total: data.pagination.total, totalPages: data.pagination.totalPages }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, filters]);

  useEffect(() => { fetchAssessments(); }, [fetchAssessments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const method = editing ? "PATCH" : "POST";
      const url = editing ? `/api/admin/assessments/${editing.id}` : "/api/admin/assessments";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Failed to save");
      }
      setShowCreate(false);
      setEditing(null);
      setForm({
        title: "", description: "", type: "APTITUDE", difficulty: "BEGINNER",
        careerStages: [], timeLimitMinutes: 30, passingScore: 60,
        negativeMarking: false, allowBackNavigation: true,
        showExplanationsAfter: true, maxAttempts: 0, status: "DRAFT",
      });
      fetchAssessments();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (a: Assessment) => {
    setEditing(a);
    setForm({
      title: a.title,
      description: a.description,
      type: a.type,
      difficulty: a.difficulty,
      careerStages: a.careerStages,
      timeLimitMinutes: a.timeLimitMinutes,
      passingScore: a.passingScore,
      negativeMarking: a.negativeMarking,
      allowBackNavigation: a.allowBackNavigation,
      showExplanationsAfter: a.showExplanationsAfter,
      maxAttempts: a.maxAttempts,
      status: a.status,
    });
    setShowCreate(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this assessment? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/assessments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      fetchAssessments();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const handleNew = () => {
    setEditing(null);
    setForm({
      title: "", description: "", type: "APTITUDE", difficulty: "BEGINNER",
      careerStages: [], timeLimitMinutes: 30, passingScore: 60,
      negativeMarking: false, allowBackNavigation: true,
      showExplanationsAfter: true, maxAttempts: 0, status: "DRAFT",
    });
    setShowCreate(true);
  };

  if (loading && assessments.length === 0) {
    return <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}><ProgressBar percent={50} /></div>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1>Assessment Management</h1>
        <div style={{ display: "flex", gap: 12 }}>
          <SelectField
            id="filter-status"
            label="Status"
            options={{ "": "All Status", DRAFT: "Draft", PUBLISHED: "Published", ARCHIVED: "Archived" }}
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            style={{ minWidth: 180 }}
          />
          <SelectField
            id="filter-type"
            label="Type"
            options={{ "": "All Types", APTITUDE: "Aptitude", TECHNICAL: "Technical", CODING: "Coding", READINESS: "Readiness" }}
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
            style={{ minWidth: 180 }}
          />
          <Button variant="solid" onClick={handleNew}>Create Assessment</Button>
        </div>
      </div>

      {showCreate && (
        <Card style={{ marginBottom: 24, padding: 24 }}>
          <h3 style={{ marginBottom: 16 }}>{editing ? "Edit Assessment" : "Create Assessment"}</h3>
          {error && <div className="err" style={{ marginBottom: 16 }}>{error}</div>}
          <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <TextField id="title" label="Title *" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <TextAreaField id="description" label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div>
              <SelectField id="type" label="Type" options={{ APTITUDE: "Aptitude", TECHNICAL: "Technical", CODING: "Coding", READINESS: "Readiness" }} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} />
            </div>
            <div>
              <SelectField id="difficulty" label="Difficulty" options={{ BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced" }} value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))} />
            </div>
            <div>
              <SelectField id="status" label="Status" options={{ DRAFT: "Draft", PUBLISHED: "Published", ARCHIVED: "Archived" }} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Career Stages</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {["STUDENT", "FRESHER", "PROFESSIONAL"].map((cs) => (
                  <label key={cs} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", border: "1px solid var(--color-border)", borderRadius: "6px", cursor: "pointer", background: form.careerStages.includes(cs) ? "var(--color-brand-bg)" : "transparent" }}>
                    <input type="checkbox" checked={form.careerStages.includes(cs)} onChange={(e) => setForm((f) => ({ ...f, careerStages: e.target.checked ? [...f.careerStages, cs] : f.careerStages.filter((v) => v !== cs) }))} />
                    {cs}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <TextField type="number" id="timeLimitMinutes" label="Time Limit (min)" value={form.timeLimitMinutes} onChange={(e) => setForm((f) => ({ ...f, timeLimitMinutes: parseInt(e.target.value) || 30 }))} min={5} max={180} />
            </div>
            <div>
              <TextField type="number" id="passingScore" label="Passing Score (%)" value={form.passingScore} onChange={(e) => setForm((f) => ({ ...f, passingScore: parseInt(e.target.value) || 60 }))} min={0} max={100} />
            </div>
            <div>
              <TextField type="number" id="maxAttempts" label="Max Attempts (0 = unlimited)" value={form.maxAttempts} onChange={(e) => setForm((f) => ({ ...f, maxAttempts: parseInt(e.target.value) || 0 }))} min={0} max={10} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" id="negativeMarking" checked={form.negativeMarking} onChange={(e) => setForm((f) => ({ ...f, negativeMarking: e.target.checked }))} />
              <label htmlFor="negativeMarking">Negative Marking</label>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" id="allowBackNavigation" checked={form.allowBackNavigation} onChange={(e) => setForm((f) => ({ ...f, allowBackNavigation: e.target.checked }))} />
              <label htmlFor="allowBackNavigation">Allow Back Navigation</label>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" id="showExplanationsAfter" checked={form.showExplanationsAfter} onChange={(e) => setForm((f) => ({ ...f, showExplanationsAfter: e.target.checked }))} />
              <label htmlFor="showExplanationsAfter">Show Explanations After</label>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" id="maxAttempts" checked={form.maxAttempts > 0} onChange={(e) => setForm((f) => ({ ...f, maxAttempts: e.target.checked ? 1 : 0 }))} />
              <label htmlFor="maxAttempts">Limit Attempts</label>
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
              <Button type="button" variant="outline" onClick={() => { setShowCreate(false); setEditing(null); }}>Cancel</Button>
              <Button type="submit" variant="solid" disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button>
            </div>
          </form>
        </Card>
      )}

      {error && <div className="err" style={{ marginBottom: 16, padding: 12, background: "var(--color-error-bg)", borderColor: "var(--color-error)", borderRadius: "8px" }}>{error}</div>}

      <Card style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <SelectField
            id="filter-status"
            label="Status"
            options={{ "": "All Status", DRAFT: "Draft", PUBLISHED: "Published", ARCHIVED: "Archived" }}
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            style={{ minWidth: 180 }}
          />
          <SelectField
            id="filter-type"
            label="Type"
            options={{ "": "All Types", APTITUDE: "Aptitude", TECHNICAL: "Technical", CODING: "Coding", READINESS: "Readiness" }}
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
            style={{ minWidth: 180 }}
          />
        </div>
      </Card>

      {assessments.length === 0 ? (
        <EmptyState>
          <h3>No assessments yet</h3>
          <p>Create your first assessment to get started.</p>
        </EmptyState>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {assessments.map((a) => (
              <Card key={a.id} style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: 4 }}>{a.title}</h3>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <Badge>{a.type}</Badge>
                      <Badge style={{ background: a.difficulty === "BEGINNER" ? "var(--color-success)" : a.difficulty === "INTERMEDIATE" ? "var(--color-warning)" : "var(--color-error)" }}>{a.difficulty}</Badge>
                      <Badge style={{ background: a.status === "PUBLISHED" ? "var(--color-success)" : a.status === "DRAFT" ? "var(--color-warning)" : "var(--color-text-muted)" }}>{a.status}</Badge>
                      {a.careerStages.map((cs) => <Badge key={cs} style={{ background: "var(--color-info)" }}>{cs}</Badge>)}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link href={`/admin/assessments/${a.id}`}>
                      <Button variant="outline" size="small">Edit</Button>
                    </Link>
                    <Button variant="outline" size="small" onClick={() => handleEdit(a)}>Manage</Button>
                    <Button variant="danger" size="small" onClick={() => handleDelete(a.id)}>Delete</Button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
                  <div>
                    <div className="mut" style={{ marginBottom: 4 }}>Questions</div>
                    <div style={{ fontWeight: 600 }}>{a._count.questions}</div>
                  </div>
                  <div>
                    <div className="mut" style={{ marginBottom: 4 }}>Attempts</div>
                    <div style={{ fontWeight: 600 }}>{a._count.attempts}</div>
                  </div>
                  <div>
                    <div className="mut" style={{ marginBottom: 4 }}>Time Limit</div>
                    <div>{a.timeLimitMinutes}m</div>
                  </div>
                  <div>
                    <div className="mut" style={{ marginBottom: 4 }}>Passing Score</div>
                    <div>{a.passingScore}%</div>
                  </div>
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