"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Card, Badge, ProgressBar, EmptyState } from "@/components/ui";

interface AssessmentResultsProps {
  attemptId: string;
  userId: string;
}

interface Attempt {
  id: string;
  status: string;
  pending?: boolean;
  message?: string;
  assessment: {
    id: string;
    title: string;
    slug: string;
    type: string;
    showExplanationsAfter: boolean;
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
    breakdown: QuestionBreakdown[];
  } | null;
}

interface QuestionBreakdown {
  questionId: string;
  marks: number;
  score: number;
  isCorrect: boolean | null;
  status: "correct" | "incorrect" | "unanswered" | "pending_ai" | "pending_code";
  feedback?: string;
  criteria?: { name: string; score: number; comment: string }[];
  question?: {
    id: string;
    text: string;
    type: string;
    difficulty: string;
    explanation: string;
    exampleAnswer: string;
    options: { id: string; text: string; correct: boolean }[];
  } | null;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "correct": return <Badge style={{ background: "var(--color-success)" }}>Correct</Badge>;
    case "incorrect": return <Badge style={{ background: "var(--color-error)" }}>Incorrect</Badge>;
    case "unanswered": return <Badge style={{ background: "var(--color-text-muted)" }}>Unanswered</Badge>;
    case "pending_ai": return <Badge style={{ background: "var(--color-info)" }}>Pending AI Evaluation</Badge>;
    case "pending_code": return <Badge style={{ background: "var(--color-warning)" }}>Pending Code Evaluation</Badge>;
    default: return <Badge>{status}</Badge>;
  }
};

const getDifficultyColor = (diff: string) => {
  switch (diff) {
    case "BEGINNER": return "var(--color-success)";
    case "INTERMEDIATE": return "var(--color-warning)";
    case "ADVANCED": return "var(--color-error)";
    default: return "var(--color-primary)";
  }
};

export function AssessmentResultsClient({ attemptId, userId }: AssessmentResultsProps) {
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/assessments/results?attemptId=${attemptId}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Results not found");
          throw new Error("Failed to load results");
        }
        const data = await res.json();
        setAttempt(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load results");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [attemptId]);

  const formatTime = (ms: number | null) => {
    if (!ms) return "N/A";
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
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
        <h2>Unable to Load Results</h2>
        <p className="err">{error}</p>
        <Link href="/assessments/history" style={{ marginTop: 16, display: "inline-block" }}>
          <Button variant="outline">Back to History</Button>
        </Link>
      </Card>
    );
  }

  if (!attempt) return null;

  if (attempt.pending) {
    return (
      <Card style={{ padding: 24, textAlign: "center" }}>
        <h2>{attempt.assessment.title}</h2>
        <p className="mut" style={{ marginTop: 8 }}>{attempt.message}</p>
        <div style={{ marginTop: 24 }}>
          <Button variant="outline" onClick={() => window.location.reload()}>Refresh</Button>
          <Link href="/assessments/history" style={{ marginLeft: 12 }}>
            <Button variant="solid">View History</Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (!attempt.result) {
    return (
      <Card style={{ padding: 24, textAlign: "center" }}>
        <h2>Results Not Available</h2>
        <p className="mut" style={{ marginTop: 8 }}>Results are not yet available for this attempt.</p>
      </Card>
    );
  }

  const result = attempt.result;
  const timeSpent = attempt.submittedAt ? new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime() : null;
  const correctCount = result.breakdown.filter((b) => b.isCorrect === true).length;
  const incorrectCount = result.breakdown.filter((b) => b.isCorrect === false).length;
  const unansweredCount = result.breakdown.filter((b) => b.isCorrect === null).length;
  const pendingCount = result.breakdown.filter((b) => b.status.startsWith("pending")).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <Link href="/assessments" style={{ textDecoration: "none", color: "var(--color-primary)", marginBottom: 8, display: "inline-block" }}>
            ← Back to Catalog
          </Link>
          <h1>{attempt.assessment.title}</h1>
          <p className="mut" style={{ marginTop: 8 }}>Completed on {new Date(attempt.submittedAt || attempt.startedAt).toLocaleDateString()}</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/assessments/history">
            <Button variant="outline">View All Results</Button>
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <Card style={{ padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: "3rem", fontWeight: 700, color: result.passed ? "var(--color-success)" : "var(--color-error)" }}>
            {result.percentage?.toFixed(1) ?? 0}%
          </div>
          <div style={{ marginTop: 8, fontSize: "1.25rem" }}>
            {result.passed ? (
              <Badge style={{ background: "var(--color-success)", fontSize: "1rem", padding: "8px 16px" }}>PASSED</Badge>
            ) : (
              <Badge style={{ background: "var(--color-error)", fontSize: "1rem", padding: "8px 16px" }}>NOT PASSED</Badge>
            )}
          </div>
          <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 24, color: "var(--color-text-muted)" }}>
            <div>{result.totalScore} / {result.maxScore} marks</div>
            <div>{formatTime(timeSpent)} spent</div>
          </div>
          <ProgressBar percent={result.percentage ?? 0} style={{ marginTop: 16, height: 12 }} />
        </Card>

        <Card style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Summary</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            <div style={{ textAlign: "center", padding: "16px", background: "var(--color-success-bg)", borderRadius: "8px", border: "1px solid var(--color-success)" }}>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-success)" }}>{correctCount}</div>
              <div className="mut">Correct</div>
            </div>
            <div style={{ textAlign: "center", padding: "16px", background: "var(--color-error-bg)", borderRadius: "8px", border: "1px solid var(--color-error)" }}>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-error)" }}>{incorrectCount}</div>
              <div className="mut">Incorrect</div>
            </div>
            <div style={{ textAlign: "center", padding: "16px", background: "var(--color-surface)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: "2rem", fontWeight: 700 }}>{unansweredCount}</div>
              <div className="mut">Unanswered</div>
            </div>
            <div style={{ textAlign: "center", padding: "16px", background: "var(--color-info-bg)", borderRadius: "8px", border: "1px solid var(--color-info)" }}>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-info)" }}>{pendingCount}</div>
              <div className="mut">Pending</div>
            </div>
          </div>
        </Card>
      </div>

      <Card style={{ marginBottom: 24, padding: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Question Review</h3>
        {result.breakdown.length === 0 ? (
          <EmptyState>No questions in this assessment.</EmptyState>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {result.breakdown.map((b, i) => {
              const q = b.question;
              return (
                <Card key={b.questionId} style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontWeight: 600 }}>Q{i + 1}</span>
                      {q && <Badge style={{ background: getDifficultyColor(q.difficulty) }}>{q.difficulty}</Badge>}
                      {q && <Badge>{q.type}</Badge>}
                      <Badge>{b.marks} marks</Badge>
                      {getStatusBadge(b.status)}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>
                      {b.score} / {b.marks}
                    </div>
                  </div>
                  {q && (
                    <p style={{ marginBottom: 12 }}>{q.text}</p>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <strong>Your Score:</strong> {b.score}/{b.marks} ({Math.round((b.score / b.marks) * 100)}%)
                    </div>
                    <div>
                      <strong>Status:</strong> {b.status.replace("_", " ")}
                    </div>
                  </div>
                  {b.feedback && (
                    <div style={{ marginTop: 12, padding: 12, background: "var(--color-surface)", borderRadius: "8px" }}>
                      <strong>Feedback:</strong> {b.feedback}
                    </div>
                  )}
                  {b.criteria && b.criteria.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <strong>Criteria:</strong>
                      <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                        {b.criteria.map((c, ci) => (
                          <li key={ci}><strong>{c.name}:</strong> {c.score}/100 - {c.comment}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {attempt.assessment.showExplanationsAfter && q && q.explanation && (
                    <details style={{ marginTop: 12 }}>
                      <summary style={{ cursor: "pointer", fontWeight: 500 }}>Show Explanation</summary>
                      <div style={{ marginTop: 8, padding: 12, background: "var(--color-success-bg)", borderRadius: "8px", border: "1px solid var(--color-success)" }}>
                        {q.explanation}
                      </div>
                    </details>
                  )}
                  {attempt.assessment.showExplanationsAfter && q && q.exampleAnswer && (
                    <details style={{ marginTop: 12 }}>
                      <summary style={{ cursor: "pointer", fontWeight: 500 }}>Show Example Answer</summary>
                      <div style={{ marginTop: 8, padding: 12, background: "var(--color-info-bg)", borderRadius: "8px", border: "1px solid var(--color-info)" }}>
                        {q.exampleAnswer}
                      </div>
                    </details>
                  )}
                  {q && q.options && q.options.length > 0 && (
                    <details style={{ marginTop: 12 }}>
                      <summary style={{ cursor: "pointer", fontWeight: 500 }}>Show Options</summary>
                      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                        {q.options.map((opt) => (
                          <div
                            key={opt.id}
                            style={{
                              padding: "8px 12px",
                              borderRadius: "6px",
                              background: opt.correct ? "var(--color-success-bg)" : "var(--color-surface)",
                              border: `1px solid ${opt.correct ? "var(--color-success)" : "var(--color-border)"}`,
                            }}
                          >
                            {opt.text} {opt.correct && <Badge style={{ marginLeft: 8, fontSize: "0.7rem" }}>Correct</Badge>}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
        <Link href={`/assessments/${attempt.assessment.slug}`}>
          <Button variant="outline">Retake Assessment</Button>
        </Link>
        <Link href="/assessments/history">
          <Button variant="solid">View All Results</Button>
        </Link>
      </div>
    </div>
  );
}