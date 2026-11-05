"use client";
import React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Button, Card, Badge, ProgressBar, Input, Textarea, Select } from "@/components/ui";

interface MockInterviewRoomProps {
  sessionId: string;
  userId: string;
}

interface Session {
  id: string;
  mode: string;
  targetRole: string | null;
  difficulty: string;
  interviewStyle: string;
  feedbackMode: string;
  questionCount: number;
  durationMinutes: number;
  status: string;
  startedAt: string | null;
  expiresAt: string | null;
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
  sourceType: string;
  sourceReference: string | null;
  evaluationRubric: any;
  expectedAnswerMetadata: any;
  createdAt: string;
}

interface Answer {
  id: string;
  sessionId: string;
  questionId: string;
  answerText: string | null;
  answerCode: string | null;
  programmingLanguage: string | null;
  status: string;
  submittedAt: string;
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

const getDifficultyColor = (diff: string) => {
  switch (diff) {
    case "BEGINNER": return "var(--color-success)";
    case "INTERMEDIATE": return "var(--color-warning)";
    case "ADVANCED": return "var(--color-error)";
    default: return "var(--color-primary)";
  }
};

const getTurnTypeBadge = (type: string) => {
  const colors: Record<string, string> = {
    QUESTION: "var(--color-primary)",
    FOLLOW_UP: "var(--color-info)",
    HINT: "var(--color-warning)",
    CLARIFICATION: "var(--color-warning)",
    END: "var(--color-success)",
  };
  const labels: Record<string, string> = {
    QUESTION: "Question",
    FOLLOW_UP: "Follow-up",
    HINT: "Hint",
    CLARIFICATION: "Clarification",
    END: "Complete",
  };
  return (
    <span className="badge" style={{ background: colors[type] || "var(--color-primary)" }}>
      {labels[type] || type}
    </span>
  );
};

export function MockInterviewRoomClient({ sessionId, userId }: MockInterviewRoomProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [answerCode, setAnswerCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const deadlineRef = useRef<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/mock-interviews/${sessionId}`);
      if (!res.ok) throw new Error("Failed to load session");
      const data = await res.json();
      setSession(data.mockInterview);
      if (data.mockInterview.expiresAt) {
        deadlineRef.current = new Date(data.mockInterview.expiresAt).getTime();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load session");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  useEffect(() => {
    if (!deadlineRef.current) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setTimeRemaining(remaining);
      if (remaining <= 0) handleTimeUp();
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [deadlineRef.current]);

  const completeSession = async (timeUp: boolean) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/mock-interviews/${session?.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeUp, answers: session?.answers ?? [] }),
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = `/mock-interviews/${data.sessionId}`;
      }
    } catch (e) {
      console.error("Failed to complete session:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTimeUp = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    await completeSession(true);
  };

  const saveAnswer = async (text: string, code?: string) => {
    const currentQuestion = session?.questions[currentIndex];
    if (!currentQuestion) return;

    const timeout = saveTimeoutRef.current;
    if (timeout) clearTimeout(timeout);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch("/api/mock-interviews/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            questionId: currentQuestion.id,
            answerText: text,
            answerCode: code,
            programmingLanguage: (session as any)?.configuration?.codingLanguage || "javascript",
          }),
        });
      } catch (e) {
        console.error("Failed to save answer:", e);
      }
    }, 500);
  };

  const handleTextChange = (text: string) => {
    setAnswerText(text);
    saveAnswer(text);
  };

  const handleCodeChange = (code: string) => {
    setAnswerCode(code);
    saveAnswer(answerText, code);
  };

  const handleHint = async () => {
    const currentQuestion = session?.questions[currentIndex];
    if (!currentQuestion) return;

    try {
      const res = await fetch("/api/mock-interviews/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, questionId: currentQuestion.id, action: "hint" }),
      });
      if (!res.ok) throw new Error("Failed to get hint");
      const data = await res.json();
      setHint(data.hint);
      setShowHint(true);
    } catch (e) {
      console.error("Failed to get hint:", e);
    }
  };

  const handleSkip = async () => {
    const currentQuestion = session?.questions[currentIndex];
    if (!currentQuestion) return;

    try {
      const res = await fetch("/api/mock-interviews/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, questionId: currentQuestion.id, action: "skip" }),
      });
      if (!res.ok) throw new Error("Failed to skip");
      navigateTo(currentIndex + 1);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to skip");
    }
  };

  const navigateTo = (index: number) => {
    if (!session) return;
    if (index < 0 || index >= session.questions.length) return;
    if (!((session as any)?.configuration?.allowBackNavigation) && index < currentIndex) return;
    setCurrentIndex(index);
    setAnswerText("");
    setAnswerCode("");
    setHint(null);
    setShowHint(false);
  };

  const getCurrentQuestion = () => session?.questions[currentIndex];

  const isQuestionAnswered = (qId: string) => {
    const ans = session?.answers.find(a => a.questionId === qId && a.status === "SUBMITTED");
    return !!ans;
  };

  const handleSubmit = async (force = false) => {
    if (submitting) return;
    if (!force && !window.confirm("Submit this interview? You cannot change answers after submitting.")) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/mock-interviews/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) throw new Error("Failed to complete");
      window.location.href = `/mock-interviews/${sessionId}/results`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to complete");
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m}:${s.toString().padStart(2, "0")}`;
  };

  const renderQuestion = () => {
    if (!session) return null;
    const question = getCurrentQuestion();
    if (!question) return null;

    const isAnswered = isQuestionAnswered(question.id);
    const evaluation = session.evaluations.find(e => e.questionId === question.id);

    const onTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleTextChange(e.target.value);
    };

    const onCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleCodeChange(e.target.value);
    };

    return (
      <Card style={{ maxWidth: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {getTurnTypeBadge(question.turnType)}
            <Badge style={{ background: getDifficultyColor(question.difficulty) }}>{question.difficulty}</Badge>
            <span className="mut">Q{question.sequenceNumber} of {session.questions.length}</span>
          </div>
        </div>

        <h3 style={{ marginBottom: 16, lineHeight: 1.5 }}>{question.questionText}</h3>

        {question.questionType === "CODING" ? (
          <div style={{ marginBottom: 16 }}>
            <Textarea
              value={answerCode}
              onChange={onCodeChange}
              placeholder={`Write your ${question.questionType === "CODING" ? "solution" : "answer"} here...`}
              style={{ minHeight: 300, fontFamily: "monospace", fontSize: 14 }}
            />
            <div className="mut" style={{ marginTop: 8 }}>
              Language: {question.questionType === "CODING" ? "JavaScript" : "Auto-detect"}
            </div>
          </div>
        ) : question.questionType === "SQL" ? (
          <div style={{ marginBottom: 16 }}>
            <Textarea
              value={answerCode || answerText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleCodeChange(e.target.value)}
              placeholder="Write your SQL query here..."
              style={{ minHeight: 200, fontFamily: "monospace", fontSize: 14 }}
            />
          </div>
        ) : (
          <Textarea
            value={answerText}
             onChange={onTextChange}
            placeholder="Type your answer here..."
            style={{ minHeight: question.questionType === "LONG_ANSWER" ? 200 : 120 }}
          />
        )}

        {showHint && hint && (
          <div style={{ marginTop: 16, padding: 12, background: "var(--color-info-bg)", borderRadius: "8px", border: "1px solid var(--color-info)" }}>
            <strong>Hint:</strong> {hint}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {currentIndex > 0 && (
              <Button variant="outline" onClick={() => navigateTo(currentIndex - 1)}>Previous</Button>
            )}
            {currentIndex < (session?.questions.length || 0) - 1 && (
              <Button variant="outline" onClick={() => navigateTo(currentIndex + 1)}>Next</Button>
            )}
          </div>
          {currentIndex === (session?.questions.length || 0) - 1 && (
            <Button variant="solid" onClick={() => handleSubmit(false)} disabled={submitting}>
              {submitting ? "Submitting..." : "Complete Interview"}
            </Button>
          )}
        </div>

        {evaluation && (
          <div style={{ marginTop: 24, padding: 16, background: "var(--color-surface)", borderRadius: "8px" }}>
            <h4 style={{ marginBottom: 8 }}>Feedback</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 12 }}>
              <div>
                <strong>Score:</strong> {evaluation.overallScore !== null ? `${evaluation.overallScore}/100` : "N/A"}
              </div>
              <div>
                <strong>Status:</strong> {evaluation.evaluationStatus}
              </div>
            </div>
            {evaluation.strengths.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <strong>Strengths:</strong>
                <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                  {evaluation.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            {evaluation.improvements.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <strong>Improvements:</strong>
                <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                  {evaluation.improvements.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            {evaluation.missingConcepts.length > 0 && (
              <div>
                <strong>Missing Concepts:</strong>
                <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                  {evaluation.missingConcepts.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>
    );
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
        <h2>Error Loading Interview</h2>
        <p className="err">{error}</p>
        <a href={`/mock-interviews`} style={{ marginTop: 16, display: "inline-block" }}>
          <Button variant="outline">Back to Dashboard</Button>
        </a>
      </Card>
    );
  }

  if (!session) return null;

  const answeredCount = session.answers.filter(a => a.status === "SUBMITTED").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "var(--color-background)", borderBottom: "1px solid var(--color-border)", padding: "12px 16px" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/mock-interviews" style={{ textDecoration: "none", color: "var(--color-text-muted)" }}>
              ← Mock Interviews
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="mut" style={{ fontSize: "0.85rem" }}>Question</span>
              <span style={{ fontWeight: 600, fontSize: "1.1rem" }}>{currentIndex + 1} / {session.questions.length}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span className="mut">Answered:</span>
              <strong>{session.answers.filter(a => a.status === "SUBMITTED").length}</strong>
              <span className="mut">/</span>
              <strong>{session.questions.length}</strong>
            </div>
            <div style={{ width: 200 }}>
              <ProgressBar percent={(session.answers.filter(a => a.status === "SUBMITTED").length / session.questions.length) * 100} />
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: 600, fontVariantNumeric: "tabular-nums", fontFamily: "monospace", color: timeRemaining < 300 ? "var(--color-error)" : "var(--color-text)" }}>
              {formatTime(timeRemaining)}
            </div>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: "72rem", margin: "0 auto", padding: "24px 16px", width: "100%" }}>
        {renderQuestion()}

        <div style={{ marginTop: 24 }}>
          <Card style={{ padding: 16 }}>
            <h4 style={{ marginBottom: 12 }}>Question Navigator</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(48px, 1fr))", gap: 8 }}>
              {session.questions.map((q, i) => (
                <Button
                  key={q.id}
                  variant={i === currentIndex ? "solid" : isQuestionAnswered(q.id) ? "outline" : "outline"}
                  small
                  onClick={() => navigateTo(i)}
                  style={{ aspectRatio: "1" }}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}