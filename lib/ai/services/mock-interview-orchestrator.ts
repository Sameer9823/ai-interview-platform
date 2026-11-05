import "server-only";
import { PrismaClient } from "@prisma/client";
import { generateMockInterviewPlan } from "./mock-interview-context";
import { generateMockInterviewQuestion, generateFollowUpQuestion, generateHint } from "./mock-interview-question-generator";
import { evaluateMockInterviewAnswer, evaluateCodingAnswer, evaluateSQLAnswer } from "./mock-interview-evaluation";
import { generateMockInterviewReport, buildDeterministicReport } from "./mock-interview-report";
import { checkUsageLimit, recordUsage } from "./usage-manager";
import { AiServiceError } from "@/lib/ai/errors";

const prisma = new PrismaClient();

export interface CreateMockInterviewInput {
  userId: string;
  mode: string;
  targetRole?: string;
  careerLevel?: string;
  companyId?: string;
  resumeVersionId?: string;
  jobDescription?: string;
  durationMinutes: number;
  questionCount: number;
  topics: string[];
  skills: string[];
  codingLanguage?: string;
  feedbackMode: string;
  interviewStyle: string;
  difficulty: string;
}

export async function createMockInterview(input: CreateMockInterviewInput) {
  await checkUsageLimit("mock_interview_create");

  const plan = await generateMockInterviewPlan({
    userId: input.userId,
    mode: input.mode,
    targetRole: input.targetRole,
    careerLevel: input.careerLevel,
    companyId: input.companyId,
    resumeVersionId: input.resumeVersionId,
    jobDescription: input.jobDescription,
    durationMinutes: input.durationMinutes,
    questionCount: input.questionCount,
    topics: input.topics,
    skills: input.skills,
    codingLanguage: input.codingLanguage,
    difficulty: input.difficulty,
    interviewStyle: input.interviewStyle,
    feedbackMode: input.feedbackMode,
  });

  const session = await prisma.mockInterviewSession.create({
    data: {
      userId: input.userId,
      mode: input.mode as any,
      targetRole: input.targetRole,
      careerLevel: input.careerLevel as any,
      companyId: input.companyId,
      resumeVersionId: input.resumeVersionId,
      jobDescriptionSnapshot: input.jobDescription ? { text: input.jobDescription } : undefined,
      contextSnapshot: {
        userId: input.userId,
        mode: input.mode,
        targetRole: input.targetRole,
        careerLevel: input.careerLevel,
        companyId: input.companyId,
        resumeVersionId: input.resumeVersionId,
        topics: input.topics,
        skills: input.skills,
      },
      configuration: {
        mode: input.mode,
        targetRole: input.targetRole,
        careerLevel: input.careerLevel,
        companyId: input.companyId,
        resumeVersionId: input.resumeVersionId,
        jobDescription: input.jobDescription,
        durationMinutes: input.durationMinutes,
        questionCount: input.questionCount,
        topics: input.topics,
        skills: input.skills,
        codingLanguage: input.codingLanguage,
        feedbackMode: input.feedbackMode,
        interviewStyle: input.interviewStyle,
        difficulty: input.difficulty,
      },
      interviewPlan: plan as any,
      status: "READY",
      difficulty: input.difficulty as any,
      questionCount: input.questionCount,
      durationMinutes: input.durationMinutes,
      topics: input.topics,
      skills: input.skills,
      codingLanguage: input.codingLanguage,
      feedbackMode: input.feedbackMode as any,
      interviewStyle: input.interviewStyle as any,
    },
  });

  await recordUsage({
    operation: "mock_interview_create",
    model: "unknown",
    inputTokens: 0,
    outputTokens: 0,
  });

  return session;
}

export async function startMockInterview(sessionId: string, userId: string) {
  const session = await prisma.mockInterviewSession.findFirst({
    where: { id: sessionId, userId },
    include: { questions: true },
  });

  if (!session) throw new Error("Session not found");
  if (session.status !== "READY" && session.status !== "DRAFT") {
    throw new Error(`Cannot start session in status: ${session.status}`);
  }

  const expiresAt = new Date(Date.now() + (session.durationMinutes || 30) * 60 * 1000 + 5 * 60 * 1000);

  const updated = await prisma.mockInterviewSession.update({
    where: { id: sessionId },
    data: {
      status: "IN_PROGRESS",
      startedAt: new Date(),
      expiresAt,
    },
  });

  return updated;
}

export async function getMockInterviewSession(sessionId: string, userId: string) {
  const session = await prisma.mockInterviewSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      questions: { orderBy: { sequenceNumber: "asc" } },
      answers: { orderBy: { submittedAt: "asc" } },
      evaluations: true,
      report: true,
    },
  });
  return session;
}

export async function submitMockInterviewAnswer(
  sessionId: string,
  userId: string,
  questionId: string,
  answerText: string,
  answerCode?: string,
  programmingLanguage?: string,
  idempotencyKey?: string
) {
  const session = await prisma.mockInterviewSession.findFirst({
    where: { id: sessionId, userId },
    include: { questions: true },
  });

  if (!session) throw new Error("Session not found");
  if (session.status !== "IN_PROGRESS") throw new Error("Session not in progress");

  const question = await prisma.mockInterviewQuestion.findFirst({
    where: { id: questionId, sessionId },
  });

  if (!question) throw new Error("Question not found");

  // Check for duplicate submission
  if (idempotencyKey) {
    const existing = await prisma.mockInterviewAnswer.findUnique({
      where: { idempotencyKey },
    });
    if (existing) return existing;
  }

  // Check if question is the current one (in sequence)
  const answeredCount = await prisma.mockInterviewAnswer.count({
    where: { sessionId, status: "SUBMITTED" },
  });

  const isCurrentQuestion = question.sequenceNumber === answeredCount + 1;
  if (!isCurrentQuestion && question.sequenceNumber > answeredCount + 1) {
    throw new Error("Cannot skip ahead. Answer questions in sequence.");
  }

  const answer = await prisma.mockInterviewAnswer.create({
    data: {
      sessionId,
      questionId,
      userId,
      answerText,
      answerCode,
      programmingLanguage,
      status: "SUBMITTED",
      idempotencyKey: idempotencyKey || `${sessionId}-${questionId}-${Date.now()}`,
    },
  });

  return answer;
}

export async function requestHint(sessionId: string, userId: string, questionId: string) {
  const session = await prisma.mockInterviewSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) throw new Error("Session not found");

  const question = await prisma.mockInterviewQuestion.findFirst({
    where: { id: questionId, sessionId },
  });

  if (!question) throw new Error("Question not found");

  const hint = await generateHint(
    question.questionText,
    question.questionType,
    "", // No answer yet
    question.topicTags.join(", "),
    question.difficulty
  );

  // Log hint request as an answer with HINT_REQUESTED status
  await prisma.mockInterviewAnswer.create({
    data: {
      sessionId,
      questionId,
      userId: session.userId,
      answerText: "[HINT REQUESTED]",
      status: "HINT_REQUESTED",
      idempotencyKey: `${sessionId}-${questionId}-hint-${Date.now()}`,
    },
  });

  return { hint };
}

export async function skipQuestion(sessionId: string, userId: string, questionId: string) {
  const session = await prisma.mockInterviewSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) throw new Error("Session not found");
  if (session.status !== "IN_PROGRESS") throw new Error("Session not in progress");

  const question = await prisma.mockInterviewQuestion.findFirst({
    where: { id: questionId, sessionId },
  });

  if (!question) throw new Error("Question not found");

  // Check if it's the current question
  const answeredCount = await prisma.mockInterviewAnswer.count({
    where: { sessionId, status: "SUBMITTED" },
  });

  const isCurrentQuestion = question.sequenceNumber === answeredCount + 1;
  if (!isCurrentQuestion) {
    throw new Error("Can only skip the current question");
  }

  const answer = await prisma.mockInterviewAnswer.create({
    data: {
      sessionId,
      questionId,
      userId: session.userId,
      answerText: "[SKIPPED]",
      status: "SKIPPED",
      idempotencyKey: `${sessionId}-${questionId}-skip-${Date.now()}`,
    },
  });

  return answer;
}

export async function completeMockInterview(sessionId: string, userId: string) {
  const session = await prisma.mockInterviewSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      questions: { orderBy: { sequenceNumber: "asc" } },
      answers: { orderBy: { submittedAt: "asc" } },
      evaluations: true,
    },
  });

  if (!session) throw new Error("Session not found");
  if (session.status !== "IN_PROGRESS") throw new Error("Session not in progress");

  // Evaluate all unanswered answers
  const unevaluatedAnswers = session.answers.filter(a => 
    a.status === "SUBMITTED" && 
    !session.evaluations.some(e => e.answerId === a.id)
  );

  for (const answer of unevaluatedAnswers) {
    const question = session.questions.find(q => q.id === answer.questionId);
    if (!question) continue;

    try {
      let evaluation: any;
      if (question.questionType === "CODING") {
         evaluation = await evaluateCodingAnswer(
          question as any,
          answer.answerCode || answer.answerText || "",
          answer.programmingLanguage || "javascript",
          question.evaluationRubric as any,
          question.evaluationRubric as any
        );
      } else if (question.questionType === "SQL") {
        evaluation = await evaluateSQLAnswer(question as any, answer.answerText || "");
      } else {
        evaluation = await evaluateMockInterviewAnswer(
          question as any,
          answer.answerText || "",
          answer.answerCode || undefined,
          answer.programmingLanguage || undefined,
          { mode: session.mode, targetRole: session.targetRole || "", difficulty: question.difficulty, interviewStyle: session.interviewStyle }
        );
      }

      await prisma.mockInterviewEvaluation.create({
        data: {
          sessionId,
          questionId: question.id,
          answerId: answer.id,
          rubricVersion: evaluation.rubricVersion || "1.0",
          dimensionScores: evaluation.dimensionScores,
          overallScore: evaluation.overallScore,
          strengths: evaluation.strengths,
          improvements: evaluation.improvements,
          missingConcepts: evaluation.missingConcepts,
          evidence: evaluation.evidence,
          confidenceStatus: evaluation.confidenceStatus,
          evaluationStatus: evaluation.evaluationStatus,
        },
      });
    } catch (e) {
      console.error(`Failed to evaluate answer ${answer.id}:`, e);
      // Create a placeholder evaluation
      await prisma.mockInterviewEvaluation.create({
        data: {
          sessionId,
          questionId: question.id,
          answerId: answer.id,
          rubricVersion: "1.0",
          dimensionScores: [],
          overallScore: null,
          strengths: [],
          improvements: ["Evaluation failed - requires manual review"],
          missingConcepts: [],
          evidence: ["Evaluation error"],
          confidenceStatus: "LOW",
          evaluationStatus: "FAILED",
        },
      });
    }
  }

  // Generate report
  const questionsDetail = session.questions.map(q => {
    const answer = session.answers.find(a => a.questionId === q.id);
    const evaluation = session.evaluations.find(e => e.questionId === q.id);
    return {
      ...q,
      answerText: answer?.answerText,
      answerCode: answer?.answerCode,
      programmingLanguage: answer?.programmingLanguage,
      evaluation: evaluation ? {
        overallScore: evaluation.overallScore,
        dimensionScores: evaluation.dimensionScores,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        missingConcepts: evaluation.missingConcepts,
      } : null,
    };
  });

  let report: any;
  try {
    report = await generateMockInterviewReport(
      session.id,
      session.mode,
      session.targetRole || "",
      session.difficulty,
      session.interviewStyle,
      session.durationMinutes,
      session.startedAt && session.completedAt 
        ? Math.round((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 60000)
        : session.durationMinutes,
      session.questions.length,
      session.answers.filter(a => a.status === "SUBMITTED").length,
      session.answers.filter(a => a.status === "SKIPPED").length,
      session.questions.filter(q => q.turnType === "FOLLOW_UP").length,
      questionsDetail,
      session.targetRole || "",
      session.careerLevel || undefined,
      session.interviewStyle,
      {} // skillBreakdown - would need to compute from evaluations
    );
  } catch (e) {
    console.error("Failed to generate AI report, using deterministic:", e);
    report = buildDeterministicReport(session.id, session.userId, session.questions.map(q => ({
      ...q,
      answerText: session.answers.find(a => a.questionId === q.id)?.answerText,
      evaluation: session.evaluations.find(e => e.questionId === q.id) ? {
        overallScore: session.evaluations.find(e => e.questionId === q.id)!.overallScore,
        dimensionScores: session.evaluations.find(e => e.questionId === q.id)!.dimensionScores,
        strengths: session.evaluations.find(e => e.questionId === q.id)!.strengths,
        improvements: session.evaluations.find(e => e.questionId === q.id)!.improvements,
        missingConcepts: session.evaluations.find(e => e.questionId === q.id)!.missingConcepts,
      } : null,
    })), session.mode, session.targetRole || "");
  }

  await prisma.mockInterviewReport.create({
    data: {
      sessionId,
      userId,
      reportVersion: 1,
      overallScore: report.overallScore,
      skillBreakdown: report.skillBreakdown,
      summary: report.summary,
      recommendations: report.recommendations,
      evaluationCoverage: report.evaluationCoverage,
      limitations: report.limitations,
    },
  });

  const completed = await prisma.mockInterviewSession.update({
    where: { id: sessionId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  await recordUsage({
    operation: "mock_interview_complete",
    model: "unknown",
    inputTokens: 0,
    outputTokens: 0,
  });

  return { session: completed, report };
}

export async function getUserMockInterviewHistory(userId: string, page = 1, pageSize = 20) {
  const [sessions, total] = await Promise.all([
    prisma.mockInterviewSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        report: true,
        _count: { select: { questions: true, answers: true } },
      },
    }),
    prisma.mockInterviewSession.count({ where: { userId } }),
  ]);

  return {
    sessions: sessions.map(s => ({
      ...s,
      score: s.report?.overallScore ?? null,
      questionsAnswered: s._count.answers,
      totalQuestions: s._count.questions,
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function deleteMockInterview(sessionId: string, userId: string) {
  const session = await prisma.mockInterviewSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) throw new Error("Session not found");

  // Soft delete by marking as cancelled
  await prisma.mockInterviewSession.update({
    where: { id: sessionId },
    data: { status: "CANCELLED" },
  });

  return { ok: true };
}