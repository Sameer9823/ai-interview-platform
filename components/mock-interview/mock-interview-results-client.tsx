"use client";
import React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Card, Badge, ProgressBar, EmptyState } from "@/components/ui";

interface MockInterviewResultsProps {
  sessionId: string;
}

interface Session {
  id: string;
  mode: string;
  targetRole: string | null;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  passed: boolean | null;
  report: {
    id: string;
    overallScore: number | null;
    skillBreakdown: any[];
    summary: string;
    recommendations: any[];
    evaluationCoverage: any;
    limitations: string | null;
  } | null;
  questions: Question[];
  answers: Answer[];
  evaluations: Evaluation[];
}

interface Question {
  id: string;
  sequenceNumber: number;
  turnType: string;
  questionType: string;
  questionText: string;
  topicTags: string[];
  difficulty: string;
}

interface Answer {
  id: string;
  questionId: string;
  answerText: string | null;
  answerCode: string | null;
  programmingLanguage: string | null;
  status: string;
}

interface Evaluation {
  id: string;
  questionId: string;
  answerId: string;
  overallScore: number | null;
  dimensionScores: any[];
  strengths: string[];
  improvements: string[];
  missingConcepts: string[];
  evaluationStatus: string;
  createdAt: string;
}

export function MockInterviewResultsClient({ sessionId }: MockInterviewResultsProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/mock-interviews/${sessionId}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Results not found");
          throw new Error("Failed to load results");
        }
        const data = await res.json();
        setSession(data.mockInterview);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load results");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [sessionId]);

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
        <Link href="/mock-interviews" style={{ marginTop: 16, display: "inline-block" }}>
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </Card>
    );
  }

  if (!session) return null;

  const report = session.report;
  const timeSpent = session.submittedAt
    ? new Date(session.submittedAt).getTime() - new Date(session.startedAt).getTime()
    : null;

  if (!report) {
    return (
      <Card style={{ padding: 24, textAlign: "center" }}>
        <h2>Results Not Ready</h2>
        <p className="mut" style={{ marginTop: 8 }}>The interview evaluation is still in progress. Please check back shortly.</p>
        <div style={{ marginTop: 24 }}>
          <Button variant="outline" onClick={() => window.location.reload()}>Refresh</Button>
          <Link href="/mock-interviews/history" style={{ marginLeft: 12 }}>
            <Button variant="solid">View History</Button>
          </Link>
        </div>
      </Card>
    );
  }

  const correctCount = session.evaluations.filter(e => e.overallScore !== null && e.overallScore >= 70).length;
  const incorrectCount = session.evaluations.filter(e => e.overallScore !== null && e.overallScore < 70).length;
  const unansweredCount = session.questions.length - session.answers.filter(a => a.status === "SUBMITTED").length;
  const pendingCount = session.questions.filter(q => !session.evaluations.find(e => e.questionId === q.id)).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <Link href="/mock-interviews" style={{ textDecoration: "none", color: "var(--color-primary)", marginBottom: 8, display: "inline-block" }}>
            ← Back to Dashboard
          </Link>
          <h1>Interview Results</h1>
          <p className="mut" style={{ marginTop: 8 }}>Completed on {new Date(session.submittedAt || session.startedAt).toLocaleDateString()}</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/mock-interviews/history">
            <Button variant="outline">View All Results</Button>
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <Card style={{ padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: "3rem", fontWeight: 700, color: report.overallScore !== null && report.overallScore >= 70 ? "var(--color-success)" : report.overallScore !== null && report.overallScore < 70 ? "var(--color-error)" : "var(--color-text)" }}>
            {report.overallScore !== null ? `${report.overallScore}%` : "Pending"}
          </div>
          <div style={{ marginTop: 8, fontSize: "1.25rem" }}>
            {report.overallScore !== null ? (
              report.overallScore >= 70 ? (
                <Badge style={{ background: "var(--color-success)", fontSize: "1rem", padding: "8px 16px" }}>PASSED</Badge>
              ) : (
                <Badge style={{ background: "var(--color-error)", fontSize: "1rem", padding: "8px 16px" }}>NEEDS IMPROVEMENT</Badge>
              )
            ) : (
              <Badge style={{ background: "var(--color-info)", fontSize: "1rem", padding: "8px 16px" }}>EVALUATING</Badge>
            )}
          </div>
          <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 24, color: "var(--color-text-muted)" }}>
            <div>{session.answers.filter(a => a.status === "SUBMITTED").length} / {session.questions.length} answered</div>
            <div>{formatTime(timeSpent)} spent</div>
          </div>
          <ProgressBar percent={report.overallScore ?? 0} style={{ marginTop: 16, height: 12 }} />
        </Card>

        <Card style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Summary</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            <div style={{ textAlign: "center", padding: "16px", background: "var(--color-success-bg)", borderRadius: "8px", border: "1px solid var(--color-success)" }}>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-success)" }}>{session.answers.filter(a => a.status === "SUBMITTED").length}</div>
              <div className="mut">Answered</div>
            </div>
            <div style={{ textAlign: "center", padding: "16px", background: "var(--color-error-bg)", borderRadius: "8px", border: "1px solid var(--color-error)" }}>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-error)" }}>{session.questions.filter(q => !session.answers.find(a => a.questionId === q.id && a.status === "SUBMITTED")).length}</div>
              <div className="mut">Skipped</div>
            </div>
            <div style={{ textAlign: "center", padding: "16px", background: "var(--color-warning-bg)", borderRadius: "8px", border: "1px solid var(--color-warning)" }}>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-warning)" }}>{session.evaluations.filter(e => e.overallScore !== null && e.overallScore < 70).length}</div>
              <div className="mut">Below 70%</div>
            </div>
            <div style={{ textAlign: "center", padding: "16px", background: "var(--color-info-bg)", borderRadius: "8px", border: "1px solid var(--color-info)" }}>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-info)" }}>{session.evaluations.filter(e => e.overallScore !== null && e.overallScore >= 70).length}</div>
              <div className="mut">Above 70%</div>
            </div>
          </div>
        </Card>
      </div>

      <Card style={{ marginBottom: 24, padding: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Skill Breakdown</h3>
        {report.skillBreakdown.length === 0 ? (
          <EmptyState>No skill breakdown available</EmptyState>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
            {report.skillBreakdown.map((skill: any, i: number) => (
              <Card key={i} style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <strong>{skill.skill}</strong>
                    <span className="badge" style={{ background: skill.category === "Technical" ? "var(--color-primary)" : skill.category === "Behavioral" ? "var(--color-info)" : "var(--color-success)" }}>{skill.category}</span>
                    <span className="badge" style={{ background: skill.score >= 70 ? "var(--color-success)" : skill.score >= 50 ? "var(--color-warning)" : "var(--color-error)" }}>
                      {skill.score}%
                    </span>
                  </div>
                </div>
                <ProgressBar percent={skill.score} style={{ marginTop: 8 }} />
                {skill.evidence && skill.evidence.length > 0 && (
                  <details style={{ marginTop: 8 }}>
                    <summary style={{ cursor: "pointer", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Evidence</summary>
                    <ul style={{ marginTop: 4, paddingLeft: 20, fontSize: "0.85rem" }}>
                      {skill.evidence.slice(0, 3).map((e: string, i: number) => <li key={i}>{e}</li>)}
                    </ul>
                  </details>
                )}
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Card style={{ marginBottom: 24, padding: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Recommendations</h3>
        {report.recommendations.length === 0 ? (
          <EmptyState>No specific recommendations at this time</EmptyState>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {report.recommendations.map((rec: any, i: number) => (
              <Card key={i} style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <h4>{rec.title}</h4>
                  <span className="badge" style={{ background: rec.priority === 1 ? "var(--color-error)" : rec.priority === 2 ? "var(--color-warning)" : "var(--color-info)" }}>
                    Priority {rec.priority}
                  </span>
                </div>
                <p className="mut" style={{ marginBottom: 8 }}>{rec.description}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Badge>{rec.category}</Badge>
                  <Badge>{rec.expectedEffort}</Badge>
                </div>
                {rec.relatedSkills.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <strong>Related Skills:</strong> {rec.relatedSkills.join(", ")}
                  </div>
                )}
                {rec.suggestedTasks && rec.suggestedTasks.length > 0 && (
                  <ul style={{ marginTop: 8, paddingLeft: 20, fontSize: "0.85rem" }}>
                    {rec.suggestedTasks.map((t: string, ti: number) => <li key={ti}>{t}</li>)}
                  </ul>
                )}
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Card style={{ marginBottom: 24, padding: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Question Review</h3>
        {session.questions.length === 0 ? (
          <EmptyState>No questions in this interview</EmptyState>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {session.questions.map((q, i) => {
              const answer = session.answers.find(a => a.questionId === q.id);
              const evaluation = session.evaluations.find(e => e.questionId === q.id);
              return (
                <Card key={q.id} style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontWeight: 600 }}>Q{i + 1}</span>
                      <span className="badge" style={{ background: q.difficulty === "BEGINNER" ? "var(--color-success)" : q.difficulty === "INTERMEDIATE" ? "var(--color-warning)" : "var(--color-error)" }}>{q.difficulty}</span>
                      <span className="badge">{q.questionType}</span>
                      <span className="badge">{q.turnType}</span>
                      {evaluation && evaluation.overallScore !== null && (
                        <span className="badge" style={{ background: evaluation.overallScore >= 70 ? "var(--color-success)" : "var(--color-error)" }}>
                          {evaluation.overallScore}/100
                        </span>
                      )}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>
                      {evaluation?.overallScore !== null && evaluation?.overallScore !== undefined ? `${evaluation.overallScore}/100` : answer?.status === "SUBMITTED" ? "Submitted" : "Skipped"}
                    </div>
                  </div>
                  <p style={{ marginBottom: 12 }}>{q.questionText}</p>
                  {evaluation && (
                    <div style={{ marginBottom: 12 }}>
                      <strong>Score:</strong> {evaluation.overallScore !== null ? `${evaluation.overallScore}/100` : "N/A"}
                    </div>
                  )}
                  {evaluation && evaluation.strengths && evaluation.strengths.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <strong>Strengths:</strong>
                      <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                        {evaluation.strengths.map((s: any, si: number) => <li key={si}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                  {evaluation && evaluation.improvements && evaluation.improvements.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <strong>Improvements:</strong>
                      <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                        {evaluation.improvements.map((s: any, si: number) => <li key={si}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                  {evaluation && evaluation.missingConcepts && evaluation.missingConcepts.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <strong>Missing Concepts:</strong>
                      <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                        {evaluation.missingConcepts.map((s: any, si: number) => <li key={si}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                  {answer && (
                    <details style={{ marginTop: 12 }}>
                      <summary style={{ cursor: "pointer", fontWeight: 500 }}>Your Answer</summary>
                      <pre style={{ marginTop: 8, padding: 12, background: "var(--color-surface)", borderRadius: "8px", whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: "0.85rem" }}>
                        {answer.answerCode || answer.answerText}
                      </pre>
                    </details>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
        <Link href={`/mock-interviews/${session.id}`}>
          <Button variant="outline">Retake Interview</Button>
        </Link>
        <Link href="/mock-interviews/history">
          <Button variant="solid">View All Results</Button>
        </Link>
      </div>
    </div>
  );
}

