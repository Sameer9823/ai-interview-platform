"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, Badge, Input, Select, Textarea } from "@/components/ui/misc";
import type { CareerStage } from "@/lib/permissions";

interface PracticeClientProps {
  initialData: {
    userId: string;
    careerStage: CareerStage | null;
    targetRole: string | null;
    skills: string[];
    skillsToImprove: string[];
    goals: string[];
  };
  questionTypes: readonly string[];
  difficulties: readonly string[];
}

export function PracticeClient({ initialData, questionTypes, difficulties }: PracticeClientProps) {
  const [step, setStep] = useState<"configure" | "session" | "complete">("configure");
  const [config, setConfig] = useState({
    topic: "",
    difficulty: difficulties[1] as string,
    questionType: questionTypes[0] as string,
    count: 5,
    companyId: "",
    useAI: true,
  });
  const [session, setSession] = useState<{
    id: string;
    title: string;
    topic: string;
    questions: Array<{
      id: string;
      position: number;
      text: string;
      type: string;
      difficulty: string;
      topic: string;
      answerOutline?: string;
      explanation?: string;
      exampleAnswer?: string;
      codeSolution?: string;
      codeLanguage?: string;
      testCases?: unknown[];
      hints?: string[];
      generatedQuestionId?: string;
      questionId?: string;
    }>;
    currentIndex: number;
    answers: Record<string, string>;
    evaluations: Record<string, { score: number; band: string }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateQuestions = async () => {
    if (!config.topic.trim()) {
      setError("Please enter a topic");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: config.topic,
          difficulty: config.difficulty,
          type: config.questionType,
          count: config.count,
          careerStage: initialData.careerStage,
          targetRole: initialData.targetRole,
          companyId: config.companyId || undefined,
          skills: initialData.skillsToImprove.length > 0 ? initialData.skillsToImprove : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate questions");

      // Create practice session
      const questionIds = data.questions.map((q: { id?: string; text: string; type: string; difficulty: string; topic: string; answerOutline?: string; explanation?: string; exampleAnswer?: string; codeSolution?: string; codeLanguage?: string; testCases?: unknown[]; hints?: string[] }, i: number) => ({
        id: q.id || `gen-${i}`,
        position: i,
        text: q.text,
        type: q.type,
        difficulty: q.difficulty,
        topic: q.topic,
        answerOutline: q.answerOutline,
        explanation: q.explanation,
        exampleAnswer: q.exampleAnswer,
        codeSolution: q.codeSolution,
        codeLanguage: q.codeLanguage,
        testCases: q.testCases,
        hints: q.hints,
        generatedQuestionId: q.id,
      })) satisfies Array<{ id: string; position: number; text: string; type: string; difficulty: string; topic: string; answerOutline?: string; explanation?: string; exampleAnswer?: string; codeSolution?: string; codeLanguage?: string; testCases?: unknown[]; hints?: string[]; generatedQuestionId?: string; questionId?: string }>;

      const sessionRes = await fetch("/api/practice/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Practice: ${config.topic}`,
          topic: config.topic,
          questionIds: questionIds.map((q: { id: string }) => q.id),
        }),
      });

      const sessionData = await sessionRes.json();
      if (!sessionRes.ok) throw new Error(sessionData.error || "Failed to create session");

      setSession({
        id: sessionData.id,
        title: sessionData.title,
        topic: config.topic,
        questions: questionIds,
        currentIndex: 0,
        answers: {},
        evaluations: {},
      });
      setStep("session");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async (answer: string) => {
    if (!session) return;
    const question = session.questions[session.currentIndex];
    if (!question) return;
    setSession((prev) => (prev ? { ...prev, answers: { ...prev.answers, [question.id]: answer } } : null));

    try {
      const res = await fetch("/api/practice/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          questionId: question.id,
          answer,
          questionType: question.type,
          difficulty: question.difficulty,
          topic: question.topic,
          answerOutline: question.answerOutline,
          explanation: question.explanation,
          exampleAnswer: question.exampleAnswer,
          codeSolution: question.codeSolution,
          codeLanguage: question.codeLanguage,
          testCases: question.testCases,
          hints: question.hints,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to evaluate answer");

      setSession((prev) =>
        prev ? { ...prev, evaluations: { ...prev.evaluations, [question.id]: data.evaluation } } : null
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to evaluate answer");
    }
  };

  const handleNextQuestion = useCallback(() => {
    setSession((prev) => (prev && prev.currentIndex < prev.questions.length - 1 ? { ...prev, currentIndex: prev.currentIndex + 1 } : prev));
  }, []);

  const handlePreviousQuestion = useCallback(() => {
    setSession((prev) => (prev && prev.currentIndex > 0 ? { ...prev, currentIndex: prev.currentIndex - 1 } : prev));
  }, []);

  if (step === "configure") {
    return (
      <Card style={{ maxWidth: "48rem" }}>
        <h2>Practice Session</h2>
        <p className="mut" style={{ marginTop: 8 }}>Generate personalized practice questions based on your goals.</p>
        {error && <div className="error" style={{ color: "var(--color-error)", marginBottom: 16 }}>{error}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
          <div>
            <label htmlFor="topic" style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Topic</label>
            <Input id="topic" value={config.topic} onChange={(e) => setConfig({ ...config, topic: e.target.value })} placeholder="e.g., Dynamic Programming, System Design, React" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div>
              <label htmlFor="difficulty" style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Difficulty</label>
              <Select id="difficulty" value={config.difficulty} onChange={(e) => setConfig({ ...config, difficulty: e.target.value })} options={difficulties.map((d) => ({ value: d, label: d }))} />
            </div>
            <div>
              <label htmlFor="questionType" style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Question Type</label>
              <Select id="questionType" value={config.questionType} onChange={(e) => setConfig({ ...config, questionType: e.target.value })} options={questionTypes.map((t) => ({ value: t, label: t }))} />
            </div>
            <div>
              <label htmlFor="count" style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Count</label>
              <Input id="count" type="number" min="1" max="20" value={config.count} onChange={(e) => setConfig({ ...config, count: parseInt(e.target.value) })} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={handleGenerateQuestions} disabled={loading} variant="solid">{loading ? "Generating..." : "Generate Questions"}</Button>
          </div>
        </div>
      </Card>
    );
  }

  if (step === "session" && session) {
    const currentQuestion = session.questions[session.currentIndex];
    if (!currentQuestion) return null;
    const isLast = session.currentIndex === session.questions.length - 1;
    const hasAnswer = !!session.answers[currentQuestion.id];
    const evaluation = session.evaluations[currentQuestion.id];

    return (
      <div style={{ maxWidth: "48rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h2>{session.title}</h2>
            <p className="mut">Question {session.currentIndex + 1} of {session.questions.length} · {currentQuestion.difficulty} · {currentQuestion.type}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={() => setStep("configure")} variant="outline">Back to Setup</Button>
          </div>
        </div>

        <Card>
          <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--color-border)" }}>
            <h3 style={{ marginBottom: 8 }}>{currentQuestion.text}</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Badge>{currentQuestion.difficulty}</Badge>
              <Badge>{currentQuestion.type}</Badge>
              {currentQuestion.topic && <Badge>{currentQuestion.topic}</Badge>}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            {currentQuestion.type === "CODING" || currentQuestion.type === "SQL" ? (
              <Textarea
                value={session.answers[currentQuestion.id] || ""}
                onChange={(e) => setSession((prev) => (prev ? { ...prev, answers: { ...prev.answers, [currentQuestion.id]: e.target.value } } : null))}
                placeholder="Write your solution here..."
                style={{ minHeight: 200, fontFamily: "monospace", fontSize: 14 }}
              />
            ) : (
              <Textarea
                value={session.answers[currentQuestion.id] || ""}
                onChange={(e) => setSession((prev) => (prev ? { ...prev, answers: { ...prev.answers, [currentQuestion.id]: e.target.value } } : null))}
                placeholder="Type your answer here..."
                style={{ minHeight: 120 }}
              />
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <Button onClick={() => handleAnswerSubmit(session.answers[currentQuestion.id] || "")} disabled={!hasAnswer || loading} variant="solid">{loading ? "Evaluating..." : "Submit Answer"}</Button>
            </div>
          </div>

          {evaluation && (
            <Card style={{ marginTop: 16, background: "var(--color-surface-elevated)" }}>
              <h4>Evaluation</h4>
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{ fontSize: "2rem", fontWeight: 700, color: (evaluation as any).score >= 70 ? "var(--color-success)" : (evaluation as any).score >= 40 ? "var(--color-warning)" : "var(--color-error)" }}>
                  {(evaluation as any).score}/100
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p className="mut">{typeof (evaluation as any).feedback === "string" ? (evaluation as any).feedback : JSON.stringify((evaluation as any).feedback)}</p>
                </div>
              </div>
              {(evaluation as any).strengths && (
                <div style={{ marginTop: 12 }}>
                  <strong>Strengths:</strong>
                  <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                    {(evaluation as any).strengths.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {(evaluation as any).improvements && (
                <div style={{ marginTop: 12 }}>
                  <strong>Improvements:</strong>
                  <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                    {(evaluation as any).improvements.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {(evaluation as any).modelAnswer && (
                <details style={{ marginTop: 12 }}>
                  <summary>Model Answer</summary>
                  <p style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{(evaluation as any).modelAnswer}</p>
                </details>
              )}
            </Card>
          )}

          {currentQuestion.hints?.length && (
            <details style={{ marginBottom: 16 }}>
              <summary>Hints</summary>
              <ol style={{ marginTop: 8, paddingLeft: 20 }}>
                {currentQuestion.hints.map((h: string, i: number) => (
                  <li key={i}>{h}</li>
                ))}
              </ol>
            </details>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
            <Button onClick={handlePreviousQuestion} disabled={session.currentIndex === 0} variant="outline">
              Previous
            </Button>
            <div style={{ display: "flex", gap: 8 }}>
              {session.questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setSession((prev) => (prev ? { ...prev, currentIndex: i } : null))}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 4,
                    border: "1px solid var(--color-border)",
                    background: session.currentIndex === i ? "var(--color-primary)" : session.answers[q.id] ? "var(--color-success)" : "transparent",
                    color: session.currentIndex === i || session.answers[q.id] ? "white" : "inherit",
                    cursor: "pointer",
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <Button onClick={isLast ? () => setStep("complete") : handleNextQuestion} variant="solid">
              {isLast ? "Finish Session" : "Next"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (step === "complete" && session) {
    const evaluatedCount = Object.keys(session.evaluations).length;
    const avgScore = evaluatedCount > 0
      ? Math.round(Object.values(session.evaluations as Record<string, { score: number }>).reduce((sum, e) => sum + (e?.score || 0), 0) / evaluatedCount)
      : 0;

    return (
      <Card style={{ maxWidth: "48rem" }}>
        <h2>Session Complete!</h2>
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <div style={{ fontSize: "3rem", fontWeight: 700, color: "var(--color-primary)" }}>{avgScore}</div>
          <div className="mut">Average Score</div>
        </div>
        <div style={{ marginTop: 24, display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Button onClick={() => setStep("configure")} variant="solid">New Session</Button>
          <Button onClick={() => setStep("configure")} variant="outline">Back to Setup</Button>
        </div>
      </Card>
    );
  }

  return null;
}
