"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button, Card, Badge, ProgressBar, Input, Textarea, Select } from "@/components/ui";

interface AssessmentTakingProps {
  slug: string;
  attemptId: string;
  userId: string;
  careerStage?: string | null;
}

interface Assessment {
  id: string;
  slug: string;
  title: string;
  type: string;
  timeLimitMinutes: number;
  passingScore: number;
  negativeMarking: boolean;
  allowBackNavigation: boolean;
  showExplanationsAfter: boolean;
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
      explanation?: string;
      exampleAnswer?: string;
      codeLanguage?: string;
    };
  }[];
}

interface AttemptAnswer {
  questionId: string;
  answerText: string;
  selectedOptionIds: string[];
  isMarkedForReview: boolean;
}

type QuestionType =
  | "MULTIPLE_CHOICE"
  | "SINGLE_ANSWER"
  | "SHORT_ANSWER"
  | "LONG_ANSWER"
  | "CODING"
  | "SQL"
  | "SCENARIO"
  | "BEHAVIORAL"
  | "SYSTEM_DESIGN"
  | "COMMUNICATION";

const getDifficultyColor = (diff: string) => {
  switch (diff) {
    case "BEGINNER": return "var(--color-success)";
    case "INTERMEDIATE": return "var(--color-warning)";
    case "ADVANCED": return "var(--color-error)";
    default: return "var(--color-primary)";
  }
};

export function AssessmentTakingClient({ slug, attemptId, userId, careerStage }: AssessmentTakingProps) {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, AttemptAnswer>>(new Map());
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const deadlineRef = useRef<number>(0);
  const saveTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const fetchAssessment = useCallback(async () => {
    try {
      const res = await fetch(`/api/assessments/${slug}?attemptId=${attemptId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Assessment not found");
        throw new Error("Failed to load assessment");
      }
      const data = await res.json();
      setAssessment(data.assessment);
      if (data.attempt?.deadlineAt) {
        deadlineRef.current = new Date(data.attempt.deadlineAt).getTime();
      }
      if (data.attempt?.answers) {
        const ansMap = new Map<string, AttemptAnswer>();
        data.attempt.answers.forEach((a: AttemptAnswer) => ansMap.set(a.questionId, a));
        setAnswers(ansMap);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load assessment");
    } finally {
      setLoading(false);
    }
  }, [slug, attemptId]);

  useEffect(() => {
    fetchAssessment();
  }, [fetchAssessment]);

  useEffect(() => {
    if (!deadlineRef.current) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setTimeRemaining(remaining);
      if (remaining <= 0) {
        handleTimeUp();
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [deadlineRef.current]);

  const handleTimeUp = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    await submitAttempt(true);
  };

  const submitAttempt = async (timeUp: boolean) => {
    setSubmitting(true);
    try {
      await fetch("/api/assessments/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: attemptId,
          answers: Array.from(answers.values()),
          timeUp,
        }),
      });
      router.push(`/assessments/${slug}/results`);
    } catch (e) {
      console.error("Failed to submit attempt:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const saveAnswer = async (questionId: string, answerText: string, selectedOptionIds: string[] = []) => {
    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(questionId, { questionId, answerText, selectedOptionIds, isMarkedForReview: next.get(questionId)?.isMarkedForReview ?? false });
      return next;
    });

    const timeout = saveTimeoutRef.current.get(questionId);
    if (timeout) clearTimeout(timeout);

    saveTimeoutRef.current.set(questionId, setTimeout(async () => {
      try {
        await fetch("/api/assessments/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attemptId, questionId, answerText, selectedOptionIds }),
        });
      } catch (e) {
        console.error("Failed to save answer:", e);
      }
      saveTimeoutRef.current.delete(questionId);
    }, 500));
  };

  const toggleMarkForReview = (questionId: string) => {
    setAnswers((prev) => {
      const next = new Map(prev);
      const existing = next.get(questionId);
      if (existing) {
        next.set(questionId, { ...existing, isMarkedForReview: !existing.isMarkedForReview });
      }
      return next;
    });
  };

  const navigateTo = (index: number) => {
    if (!assessment) return;
    if (index < 0 || index >= assessment.questions.length) return;
    if (!assessment.allowBackNavigation && index < currentIndex) return;
    setCurrentIndex(index);
  };

  const getQuestionStatus = (qId: string) => {
    const ans = answers.get(qId);
    if (!ans) return "unanswered";
    if (ans.isMarkedForReview) return "review";
    if (ans.answerText.trim() || ans.selectedOptionIds.length > 0) return "answered";
    return "unanswered";
  };

  const handleSubmit = async (force = false) => {
    if (submitting) return;
    if (!force && !showSubmitConfirm) {
      setShowSubmitConfirm(true);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/assessments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to submit" }));
        throw new Error(err.error || "Failed to submit");
      }
      setSubmitted(true);
      window.location.href = `/assessments/results/${attemptId}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit");
      setSubmitting(false);
      setShowSubmitConfirm(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m}:${s.toString().padStart(2, "0")}`;
  };

  const renderQuestion = () => {
    if (!assessment) return null;
    const q = assessment.questions[currentIndex];
    if (!q) return null;
    const question = q.question;
    const answer = answers.get(question.id);
    const isAnswered = (answer?.answerText?.trim() ? answer.answerText.length : 0) + (answer?.selectedOptionIds.length || 0) > 0;

    const handleOptionChange = (optionId: string) => {
      const current = answer?.selectedOptionIds ?? [];
      const isMulti = question.type === "MULTIPLE_CHOICE";
      const next = isMulti
        ? current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId]
        : [optionId];
      saveAnswer(question.id, "", next);
    };

    const handleTextChange = (text: string) => {
      saveAnswer(question.id, text, answer?.selectedOptionIds ?? []);
    };

    return (
      <Card style={{ maxWidth: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Badge>{question.type}</Badge>
            <Badge style={{ background: getDifficultyColor(question.difficulty) }}>{question.difficulty}</Badge>
            <span className="mut">Q{q.position} of {assessment.questions.length} · {q.marks} marks</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="outline" size="small" onClick={() => toggleMarkForReview(question.id)}>
              {answer?.isMarkedForReview ? "★ Marked" : "☆ Mark for Review"}
            </Button>
          </div>
        </div>

        <h3 style={{ marginBottom: 16, lineHeight: 1.5 }}>{question.text}</h3>

        {question.type === "MULTIPLE_CHOICE" || question.type === "SINGLE_ANSWER" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {question.options.map((opt, i) => (
              <label
                key={opt.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 16px",
                  border: `2px solid ${answer?.selectedOptionIds.includes(opt.id) ? "var(--brand)" : "var(--color-border)"}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: answer?.selectedOptionIds.includes(opt.id) ? "var(--color-brand-bg)" : "transparent",
                  transition: "all 0.15s",
                }}
                onClick={() => handleOptionChange(opt.id)}
              >
                <input
                  type={question.type === "MULTIPLE_CHOICE" ? "checkbox" : "radio"}
                  name={`q-${question.id}`}
                  checked={answer?.selectedOptionIds.includes(opt.id)}
                  onChange={() => handleOptionChange(opt.id)}
                  style={{ marginRight: 12, width: 18, height: 18, accentColor: "var(--brand)" }}
                />
                <span style={{ flex: 1 }}>{opt.text}</span>
              </label>
            ))}
          </div>
        ) : question.type === "CODING" ? (
          <div style={{ marginBottom: 16 }}>
            <Textarea
              value={answer?.answerText ?? ""}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={`Write your ${question.codeLanguage || "solution"} here...`}
              style={{ minHeight: 300, fontFamily: "monospace", fontSize: 14 }}
            />
            <div className="mut" style={{ marginTop: 8 }}>
              Language: {question.codeLanguage || "Auto-detect"}
            </div>
          </div>
        ) : question.type === "SQL" ? (
          <div style={{ marginBottom: 16 }}>
            <Textarea
              value={answer?.answerText ?? ""}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Write your SQL query here..."
              style={{ minHeight: 200, fontFamily: "monospace", fontSize: 14 }}
            />
          </div>
        ) : (
          <Textarea
            value={answer?.answerText ?? ""}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Type your answer here..."
            style={{ minHeight: question.type === "LONG_ANSWER" ? 200 : 120 }}
          />
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {currentIndex > 0 && (
              <Button variant="outline" onClick={() => navigateTo(currentIndex - 1)}>Previous</Button>
            )}
            {currentIndex < assessment.questions.length - 1 && (
              <Button variant="outline" onClick={() => navigateTo(currentIndex + 1)}>Next</Button>
            )}
          </div>
          {currentIndex === assessment.questions.length - 1 && (
            <Button variant="solid" onClick={() => handleSubmit(false)}>
              Submit Assessment
            </Button>
          )}
        </div>
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
        <h2>Error Loading Assessment</h2>
        <p className="err">{error}</p>
        <a href={`/assessments/${slug}`} style={{ marginTop: 16, display: "inline-block" }}>
          <Button variant="outline">Back to Assessment</Button>
        </a>
      </Card>
    );
  }

  if (!assessment) return null;

  const answeredCount = Array.from(answers.values()).filter((a) => a.answerText.trim() || a.selectedOptionIds.length > 0).length;
  const reviewCount = Array.from(answers.values()).filter((a) => a.isMarkedForReview).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "var(--color-background)", borderBottom: "1px solid var(--color-border)", padding: "12px 16px" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href={`/assessments/${slug}`} style={{ textDecoration: "none", color: "var(--color-text-muted)" }}>
              ← {assessment.title}
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="mut" style={{ fontSize: "0.85rem" }}>Question</span>
              <span style={{ fontWeight: 600, fontSize: "1.1rem" }}>{currentIndex + 1} / {assessment.questions.length}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span className="mut">Answered:</span>
              <strong>{answeredCount}</strong>
              <span className="mut">/</span>
              <strong>{assessment.questions.length}</strong>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span className="mut">Review:</span>
              <Badge style={{ background: "var(--color-warning)" }}>{reviewCount}</Badge>
            </div>
            <div style={{ width: 200 }}>
              <ProgressBar percent={(answeredCount / assessment.questions.length) * 100} />
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
              {assessment.questions.map((q, i) => (
                <Button
                  key={q.id}
                  variant={i === currentIndex ? "solid" : getQuestionStatus(q.question.id) === "answered" ? "outline" : getQuestionStatus(q.question.id) === "review" ? "danger" : "outline"}
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

      {showSubmitConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <Card style={{ maxWidth: "400px", width: "90%", padding: 24 }}>
            <h3>Submit Assessment?</h3>
            <p className="mut" style={{ marginTop: 8, marginBottom: 24 }}>
              You have answered {answeredCount} of {assessment.questions.length} questions.
              {reviewCount > 0 && ` ${reviewCount} marked for review.`}
              This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <Button variant="outline" onClick={() => setShowSubmitConfirm(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => handleSubmit(true)} disabled={submitting}>
                {submitting ? "Submitting..." : "Confirm Submit"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}