"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, Badge, Input, Select, Textarea } from "@/components/ui/misc";
import type { CareerStage } from "@/lib/permissions";
import type { Level } from "@/lib/content/types";

interface PlanClientProps {
  initialData: {
    userId: string;
    careerStage: CareerStage | null;
    targetRole: string | null;
    experienceLevel: Level | null;
    skills: string[];
    skillsToImprove: string[];
    goals: string[];
  };
}

export function PlanClient({ initialData }: PlanClientProps) {
  const [plan, setPlan] = useState<{
    id: string;
    goal: string;
    steps: Array<{
      id: string;
      title: string;
      description: string;
      topic: string;
      estimatedMinutes: number;
      type: string;
      priority: string;
      status: "TODO" | "DONE";
      completedAt: string | null;
    }>;
    milestones: string[];
    completionCriteria: string[];
    rationale: string;
    estimatedTotalHours: number;
    weeklySchedule: Array<{ week: number; focus: string; hours: number; tasks: string[] }>;
    version: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [config, setConfig] = useState({
    targetRole: initialData.targetRole || "",
    careerStage: initialData.careerStage || "",
    experienceLevel: initialData.experienceLevel || "",
    goals: initialData.goals.join(", "),
    currentSkills: initialData.skills.join(", "),
    weakTopics: initialData.skillsToImprove.join(", "),
    availableHoursPerDay: 2,
    targetWeeks: 4,
    preferredLanguage: "en",
    companyId: "",
  });

  useEffect(() => {
    fetchPlan();
  }, []);

  const fetchPlan = async () => {
    try {
      const res = await fetch("/api/ai/plan");
      if (res.ok) {
        const data = await res.json();
        if (data.plan) {
          setPlan({
            ...data.plan,
            steps: data.plan.tasks?.map((t: any, i: number) => ({
              id: t.id,
              title: t.title,
              description: t.description,
              topic: t.topic,
              estimatedMinutes: t.estimatedMinutes,
              type: "practice",
              priority: "medium",
              status: t.status,
              completedAt: t.completedAt,
            })) || [],
            milestones: data.plan.milestones || [],
            completionCriteria: data.plan.completionCriteria || [],
            rationale: data.plan.rationale || "",
            estimatedTotalHours: data.plan.estimatedTotalHours || 0,
            weeklySchedule: data.plan.weeklySchedule || [],
            version: data.plan.version || 1,
          });
        }
      }
    } catch (e) {
      console.error("Failed to fetch plan:", e);
    }
  };

  const handleCreatePlan = async () => {
    if (!config.targetRole.trim() && !config.goals.trim()) {
      setError("Please provide at least a target role or goals");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: config.targetRole || undefined,
          careerStage: config.careerStage as CareerStage | undefined,
          experienceLevel: config.experienceLevel as Level | undefined,
          goals: config.goals.split(",").map((g) => g.trim()).filter(Boolean),
          currentSkills: config.currentSkills.split(",").map((s) => s.trim()).filter(Boolean),
          weakTopics: config.weakTopics.split(",").map((s) => s.trim()).filter(Boolean),
          availableHoursPerDay: config.availableHoursPerDay,
          targetWeeks: config.targetWeeks,
          preferredLanguage: config.preferredLanguage,
          companyId: config.companyId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create plan");

      setPlan({
        id: data.planId,
        goal: data.plan.goal,
        steps: data.plan.steps.map((s: any, i: number) => ({
          id: `step-${i}`,
          title: s.title,
          description: s.description,
          topic: s.topic,
          estimatedMinutes: s.estimatedMinutes,
          type: s.type,
          priority: s.priority,
          status: "TODO" as const,
          completedAt: null,
        })),
        milestones: data.plan.milestones,
        completionCriteria: data.plan.completionCriteria,
        rationale: data.plan.rationale,
        estimatedTotalHours: data.plan.estimatedTotalHours,
        weeklySchedule: data.plan.weeklySchedule,
        version: data.version,
      });
      setShowCreate(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId: string, status: "TODO" | "DONE") => {
    try {
      const res = await fetch("/api/ai/plan/task", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status }),
      });
      if (!res.ok) throw new Error("Failed to update task");

      setPlan((prev) =>
        prev
            ? {
                ...prev,
                steps: prev.steps.map((t) =>
                  t.id === taskId ? { ...t, status, completedAt: status === "DONE" ? new Date().toISOString() : null } : t
                ),
              }
            : null
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update task");
    }
  };

  const handleRegenerate = () => {
    setShowCreate(true);
  };

  if (!plan) {
    return (
      <Card style={{ maxWidth: "48rem" }}>
        <h2>No Active Plan</h2>
        {error && <div className="error" style={{ color: "var(--color-error)", marginBottom: 16 }}>{error}</div>}
        <p className="mut" style={{ marginTop: 8 }}>Create a personalized preparation plan based on your profile and goals.</p>
        <Button onClick={() => setShowCreate(true)} variant="solid" style={{ marginTop: 16 }}>Create Plan</Button>
        {showCreate && <PlanForm config={config} setConfig={setConfig} onSubmit={handleCreatePlan} onCancel={() => setShowCreate(false)} loading={loading} error={error} />}
      </Card>
    );
  }

  const completedCount = plan.steps.filter((t) => t.status === "DONE").length;
  const totalCount = plan.steps.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div style={{ maxWidth: "48rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2>{plan.goal || "Preparation Plan"}</h2>
          <p className="mut">Version {plan.version} · {plan.estimatedTotalHours}h estimated · {progress}% complete</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={handleRegenerate} variant="outline">Regenerate Plan</Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card style={{ marginBottom: 24 }}>
        <h3>Progress</h3>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span>{completedCount} / {totalCount} tasks completed</span>
            <span>{progress}%</span>
          </div>
          <div style={{ height: 8, background: "var(--color-border)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "var(--color-primary)", transition: "width 0.3s" }} />
          </div>
          <p className="sm mut" style={{ marginTop: 8 }}>{plan.estimatedTotalHours}h total · ~{Math.round(plan.estimatedTotalHours / Math.max(1, plan.weeklySchedule.length))}h/week</p>
        </div>
      </Card>

      {/* Weekly Schedule */}
      {plan.weeklySchedule.length > 0 && (
        <Card style={{ marginBottom: 24 }}>
          <h3>Weekly Schedule</h3>
          <div style={{ marginTop: 16 }}>
            {plan.weeklySchedule.map((week) => (
              <div key={week.week} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--color-border)" }}>
                <h4>Week {week.week}: {week.focus} ({week.hours}h)</h4>
                <ul style={{ marginTop: 8 }}>
                  {week.tasks.map((task, i) => (
                    <li key={i} className="sm">{task}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Milestones */}
      {plan.milestones.length > 0 && (
        <Card style={{ marginBottom: 24 }}>
          <h3>Milestones</h3>
          <ul style={{ marginTop: 16 }}>
            {plan.milestones.map((m, i) => (
              <li key={i} style={{ marginBottom: 8 }}>{m}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Completion Criteria */}
      {plan.completionCriteria.length > 0 && (
        <Card style={{ marginBottom: 24 }}>
          <h3>Completion Criteria</h3>
          <ul style={{ marginTop: 16 }}>
            {plan.completionCriteria.map((c, i) => (
              <li key={i} style={{ marginBottom: 8 }}>{c}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Rationale */}
      {plan.rationale && (
        <Card style={{ marginBottom: 24 }}>
          <h3>Plan Rationale</h3>
          <p className="mut" style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{plan.rationale}</p>
        </Card>
      )}

      {/* Tasks */}
      <Card>
        <h3>Tasks</h3>
        {plan.steps.length === 0 ? (
          <EmptyState>No tasks in this plan.</EmptyState>
        ) : (
          <div style={{ marginTop: 16 }}>
            {plan.steps.map((task) => (
              <div
                key={task.id}
                style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 12, borderBottom: "1px solid var(--color-border)" }}
              >
                <input
                  type="checkbox"
                  checked={task.status === "DONE"}
                  onChange={(e) => handleToggleTask(task.id, e.target.checked ? "DONE" : "TODO")}
                  style={{ marginTop: 4 }}
                />
                <div style={{ flex: 1, opacity: task.status === "DONE" ? 0.6 : 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <strong>{task.title}</strong>
                    <Badge>{task.priority}</Badge>
                    <Badge>{task.type}</Badge>
                    <span className="sm mut">{task.estimatedMinutes} min</span>
                  </div>
                  {task.topic && <p className="sm mut" style={{ marginTop: 4 }}>Topic: {task.topic}</p>}
                  {task.description && <p className="sm" style={{ marginTop: 4 }}>{task.description}</p>}
                  {task.completedAt && <p className="sm mut" style={{ marginTop: 4 }}>Completed: {new Date(task.completedAt).toLocaleDateString()}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showCreate && <PlanForm config={config} setConfig={setConfig} onSubmit={handleCreatePlan} onCancel={() => setShowCreate(false)} loading={loading} error={error} />}
    </div>
  );
}

function PlanForm({ config, setConfig, onSubmit, onCancel, loading, error }: {
  config: any;
  setConfig: (c: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <Card style={{ marginTop: 24, maxWidth: "48rem" }}>
      <h3>Create New Plan</h3>
      {error && <div className="error" style={{ color: "var(--color-error)", marginBottom: 16 }}>{error}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label htmlFor="targetRole" style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Target Role</label>
            <Input id="targetRole" value={config.targetRole} onChange={(e) => setConfig({ ...config, targetRole: e.target.value })} placeholder="e.g., Senior Software Engineer" />
          </div>
          <div>
            <label htmlFor="careerStage" style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Career Stage</label>
            <Select id="careerStage" value={config.careerStage} onChange={(e) => setConfig({ ...config, careerStage: e.target.value })} options={[{value:"",label:"Auto"},{value:"STUDENT",label:"Student"},{value:"FRESHER",label:"Fresher"},{value:"PROFESSIONAL",label:"Professional"}]} />
          </div>
        </div>
        <div>
          <label htmlFor="goals" style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Goals (comma-separated)</label>
          <Input id="goals" value={config.goals} onChange={(e) => setConfig({ ...config, goals: e.target.value })} placeholder="TECHNICAL_INTERVIEWS, CODING_DSA, SYSTEM_DESIGN" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label htmlFor="availableHoursPerDay" style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Hours per Day</label>
            <Input id="availableHoursPerDay" type="number" min="0.5" max="12" step="0.5" value={config.availableHoursPerDay} onChange={(e) => setConfig({ ...config, availableHoursPerDay: parseFloat(e.target.value) })} />
          </div>
          <div>
            <label htmlFor="targetWeeks" style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Target Weeks</label>
            <Input id="targetWeeks" type="number" min="1" max="52" value={config.targetWeeks} onChange={(e) => setConfig({ ...config, targetWeeks: parseInt(e.target.value) })} />
          </div>
        </div>
        <div>
          <label htmlFor="weakTopics" style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Weak Topics (comma-separated)</label>
          <Input id="weakTopics" value={config.weakTopics} onChange={(e) => setConfig({ ...config, weakTopics: e.target.value })} placeholder="e.g., Dynamic Programming, System Design" />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={onSubmit} disabled={loading} variant="solid">{loading ? "Creating..." : "Create Plan"}</Button>
          <Button onClick={onCancel} variant="outline">Cancel</Button>
        </div>
      </div>
    </Card>
  );
}
