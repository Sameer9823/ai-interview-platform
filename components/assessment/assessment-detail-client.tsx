"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Card, Badge, EmptyState, ProgressBar } from "@/components/ui";

interface AssessmentDetailProps {
  slug: string;
  userId: string;
  careerStage?: string | null;
}

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
  allowBackNavigation: boolean;
  showExplanationsAfter: boolean;
  maxAttempts: number;
  sections: { id: string; title: string; position: number; questionCount: number }[];
  questions: {
    id: string;
    position: number;
    marks: number;
    isRequired: boolean;
    question: {
      id: string;
      type: string;
      difficulty: string;
      text: string;
      estimatedMinutes: number;
      options: { id: string; text: string }[];
    };
  }[];
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

const getDifficultyColor = (diff: string) => {
  switch (diff) {
    case "BEGINNER": return "var(--color-success)";
    case "INTERMEDIATE": return "var(--color-warning)";
    case "ADVANCED": return "var(--color-error)";
    default: return "var(--color-primary)";
  }
};

const formatTime = (mins: number) => {
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `${mins}m`;
};

export function AssessmentDetailClient({ slug, userId, careerStage }: AssessmentDetailProps) {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const fetchAssessment = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/assessments/${slug}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Assessment not found");
          throw new Error("Failed to load assessment");
        }
        const data = await res.json();
        setAssessment(data.assessment);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load assessment");
      } finally {
        setLoading(false);
      }
    };
    fetchAssessment();
  }, [slug]);

  const handleStart = async () => {
    if (!assessment) return;
    setStarting(true);
    try {
      const res = await fetch("/api/assessments/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId: assessment.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to start" }));
        throw new Error(err.error || "Failed to start assessment");
      }
      const { attemptId } = await res.json();
      window.location.href = `/assessments/${slug}/start?attemptId=${attemptId}`;
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to start assessment");
    } finally {
      setStarting(false);
    }
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
        <h2>Unable to Load Assessment</h2>
        <p className="err">{error}</p>
        <Link href="/assessments" style={{ marginTop: 16, display: "inline-block" }}>
          <Button variant="outline">Back to Catalog</Button>
        </Link>
      </Card>
    );
  }

  if (!assessment) return null;

  const totalQuestions = assessment.questions.length;
  const totalMarks = assessment.questions.reduce((sum, q) => sum + q.marks, 0);
  const estimatedTime = assessment.questions.reduce((sum, q) => sum + (q.question.estimatedMinutes || 0), 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <Link href="/assessments" style={{ textDecoration: "none", color: "var(--color-primary)", marginBottom: 8, display: "inline-block" }}>
            ← Back to Catalog
          </Link>
          <h1>{assessment.title}</h1>
          <p className="mut" style={{ marginTop: 8, maxWidth: "42.5rem" }}>{assessment.description || "No description provided."}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <Card style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Assessment Overview</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div className="mut" style={{ fontSize: "0.85rem", marginBottom: 4 }}>Type</div>
              <Badge>{getTypeLabel(assessment.type)}</Badge>
            </div>
            <div>
              <div className="mut" style={{ fontSize: "0.85rem", marginBottom: 4 }}>Difficulty</div>
              <Badge style={{ background: getDifficultyColor(assessment.difficulty) }}>{assessment.difficulty}</Badge>
            </div>
            <div>
              <div className="mut" style={{ fontSize: "0.85rem", marginBottom: 4 }}>Time Limit</div>
              <div style={{ fontWeight: 500 }}>{formatTime(assessment.timeLimitMinutes)}</div>
            </div>
            <div>
              <div className="mut" style={{ fontSize: "0.85rem", marginBottom: 4 }}>Passing Score</div>
              <div style={{ fontWeight: 500 }}>{assessment.passingScore}%</div>
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
              <div className="mut" style={{ fontSize: "0.85rem", marginBottom: 4 }}>Target Audience</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {assessment.careerStages.map((cs) => (
                  <Badge key={cs} style={{ background: "var(--color-info)" }}>{cs}</Badge>
                ))}
              </div>
            </div>
            <div>
              <div className="mut" style={{ fontSize: "0.85rem", marginBottom: 4 }}>Settings</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {assessment.negativeMarking && <Badge style={{ background: "var(--color-warning)" }}>Negative Marking</Badge>}
                {!assessment.allowBackNavigation && <Badge>No Back Navigation</Badge>}
                {!assessment.showExplanationsAfter && <Badge>Explanations Hidden</Badge>}
                {assessment.maxAttempts > 0 && <Badge>Max {assessment.maxAttempts} Attempts</Badge>}
              </div>
            </div>
          </div>
        </Card>

        <Card style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Sections & Questions</h3>
          {assessment.sections.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {assessment.sections.map((section) => (
                <div key={section.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "var(--color-surface)", borderRadius: "8px" }}>
                  <span>{section.title}</span>
                  <Badge>{section.questionCount} questions</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {assessment.questions.map((q) => (
                <div key={q.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "var(--color-surface)", borderRadius: "8px" }}>
                  <span>Q{q.position}: {q.question.text.substring(0, 60)}...</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Badge>{q.marks} marks</Badge>
                    <Badge style={{ background: getDifficultyColor(q.question.difficulty) }}>{q.question.difficulty}</Badge>
                    <Badge>{q.question.type}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
        <Link href={`/assessments/history?assessmentId=${assessment.id}`}>
          <Button variant="outline">View Your History</Button>
        </Link>
        <Button variant="solid" size="large" onClick={handleStart} disabled={starting}>
          {starting ? "Starting..." : "Start Assessment"}
        </Button>
      </div>
    </div>
  );
}