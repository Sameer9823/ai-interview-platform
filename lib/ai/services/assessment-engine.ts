import "server-only";
import { PrismaClient } from "@prisma/client";
import { evaluateAnswer, evaluateCodeAnswer, scoreToBand } from "./answer-evaluator";
import { evaluateCodeAnswer as evaluateCode } from "./answer-evaluator";
import { checkUsageLimit, recordUsage } from "./usage-manager";
import { AiServiceError } from "@/lib/ai/errors";

const prisma = new PrismaClient();

export type QuestionType =
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

export interface ScoredQuestion {
  questionId: string;
  marks: number;
  type: QuestionType;
  isRequired: boolean;
  correctAnswer?: string;
  answerOutline?: string;
  exampleAnswer?: string;
  testCases?: { input: string; expected: string }[];
  language?: string;
  negativeMarking?: boolean;
}

export interface AnswerSubmission {
  questionId: string;
  answerText: string;
  selectedOptionIds?: string[];
}

export interface ScoringResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  breakdown: QuestionBreakdown[];
  pendingAiCount: number;
}

export interface QuestionBreakdown {
  questionId: string;
  marks: number;
  score: number;
  isCorrect: boolean | null;
  status: "correct" | "incorrect" | "unanswered" | "pending_ai" | "pending_code";
  feedback?: string;
  criteria?: { name: string; score: number; comment: string }[];
  timeSpentMs?: number;
}

export interface AssessmentConfig {
  timeLimitMinutes: number;
  passingScore: number;
  negativeMarking: boolean;
  allowBackNavigation: boolean;
  showExplanationsAfter: boolean;
  maxAttempts: number;
}

function normalizeAnswer(text: string): string {
  return text.trim().toLowerCase();
}

function checkMultipleChoice(
  userAnswer: string,
  correctOptions: string[],
  marks: number,
  negativeMarking: boolean
): { score: number; isCorrect: boolean | null; feedback: string } {
  const userNorm = normalizeAnswer(userAnswer);
  const correctNorm = correctOptions.map(normalizeAnswer);

  if (!userAnswer.trim()) {
    return { score: 0, isCorrect: null, feedback: "Unanswered" };
  }

  const isCorrect = correctNorm.some((c) => userNorm.includes(c) || c.includes(userNorm));
  const score = isCorrect ? marks : negativeMarking ? -marks : 0;
  return {
    score,
    isCorrect,
    feedback: isCorrect
      ? "Correct answer."
      : `Incorrect. Correct option(s): ${correctOptions.join(", ")}`,
  };
}

function checkNumeric(
  userAnswer: string,
  correctAnswer: string,
  marks: number,
  negativeMarking: boolean,
  tolerance = 0.01
): { score: number; isCorrect: boolean | null; feedback: string } {
  if (!userAnswer.trim()) {
    return { score: 0, isCorrect: null, feedback: "Unanswered" };
  }
  const userNum = parseFloat(userAnswer);
  const correctNum = parseFloat(correctAnswer);
  if (isNaN(userNum) || isNaN(correctNum)) {
    return { score: 0, isCorrect: null, feedback: "Invalid numeric answer" };
  }
  const isCorrect = Math.abs(userNum - correctNum) <= tolerance;
  const score = isCorrect ? marks : negativeMarking ? -marks : 0;
  return {
    score,
    isCorrect,
    feedback: isCorrect
      ? "Correct answer."
      : `Incorrect. Expected: ${correctAnswer}`,
  };
}

function checkTrueFalse(
  userAnswer: string,
  correctAnswer: string,
  marks: number,
  negativeMarking: boolean
): { score: number; isCorrect: boolean | null; feedback: string } {
  const userNorm = normalizeAnswer(userAnswer);
  const correctNorm = normalizeAnswer(correctAnswer);
  if (!userAnswer.trim()) {
    return { score: 0, isCorrect: null, feedback: "Unanswered" };
  }
  const isCorrect = userNorm === correctNorm;
  const score = isCorrect ? marks : negativeMarking ? -marks : 0;
  return {
    score,
    isCorrect,
    feedback: isCorrect ? "Correct." : `Incorrect. The correct answer is ${correctAnswer}`,
  };
}

export async function scoreAttempt(
  attemptId: string,
  config: AssessmentConfig,
  questions: ScoredQuestion[],
  answers: AnswerSubmission[]
): Promise<ScoringResult> {
  const answerMap = new Map(answers.map((a) => [a.questionId, a]));
  const breakdown: QuestionBreakdown[] = [];
  let totalScore = 0;
  let maxScore = 0;
  let pendingAiCount = 0;

  for (const q of questions) {
    maxScore += q.marks;
    const answer = answerMap.get(q.questionId);
    const userAnswer = answer?.answerText ?? "";
    const selectedOptions = answer?.selectedOptionIds ?? [];

    if (q.type === "MULTIPLE_CHOICE" || q.type === "SINGLE_ANSWER") {
      const correctOptions = q.correctAnswer ? [q.correctAnswer] : [];
      const result = checkMultipleChoice(
        userAnswer,
        correctOptions,
        q.marks,
        config.negativeMarking && q.isRequired
      );
      breakdown.push({
        questionId: q.questionId,
        marks: q.marks,
        score: result.score,
        isCorrect: result.isCorrect,
        status: result.isCorrect === null ? "unanswered" : result.isCorrect ? "correct" : "incorrect",
        feedback: result.feedback,
      });
      totalScore += result.score;
    } else if (q.type === "SQL") {
      if (!userAnswer.trim()) {
        breakdown.push({
          questionId: q.questionId,
          marks: q.marks,
          score: 0,
          isCorrect: null,
          status: "unanswered",
          feedback: "Unanswered",
        });
      } else {
        const evalResult = await evaluateAnswer({
          question: q.questionId,
          questionType: "SQL",
          difficulty: "BEGINNER",
          answer: userAnswer,
          answerOutline: q.answerOutline,
        });
        const score = Math.round((evalResult.evaluation.score / 100) * q.marks);
        const isCorrect = evalResult.evaluation.score >= 75;
        breakdown.push({
          questionId: q.questionId,
          marks: q.marks,
          score,
          isCorrect,
          status: isCorrect ? "correct" : "incorrect",
          feedback: (evalResult.evaluation.criteria || [])[0]?.comment,
          criteria: evalResult.evaluation.criteria || [],
        });
        totalScore += score;
        if (!evalResult.usedDeterministic) pendingAiCount++;
      }
    } else if (q.type === "CODING") {
      if (!userAnswer.trim()) {
        breakdown.push({
          questionId: q.questionId,
          marks: q.marks,
          score: 0,
          isCorrect: null,
          status: "unanswered",
          feedback: "Unanswered",
        });
      } else {
        const { evaluation } = await evaluateCode({
          question: q.questionId,
          userCode: userAnswer,
          language: q.language || "javascript",
          expectedApproach: q.answerOutline,
          testCases: q.testCases,
          difficulty: "BEGINNER",
        });
        const score = Math.round((evaluation.score / 100) * q.marks);
        const isCorrect = evaluation.score >= 75;
        breakdown.push({
          questionId: q.questionId,
          marks: q.marks,
          score,
          isCorrect,
          status: "pending_code",
          feedback: (evaluation.criteria || [])[0]?.comment,
          criteria: evaluation.criteria || [],
        });
        totalScore += score;
        pendingAiCount++;
      }
    } else if (["SHORT_ANSWER", "LONG_ANSWER", "SCENARIO", "BEHAVIORAL", "SYSTEM_DESIGN", "COMMUNICATION"].includes(q.type)) {
      if (!userAnswer.trim()) {
        breakdown.push({
          questionId: q.questionId,
          marks: q.marks,
          score: 0,
          isCorrect: null,
          status: "unanswered",
          feedback: "Unanswered",
        });
      } else {
        const { evaluation, usedDeterministic } = await evaluateAnswer({
          question: q.questionId,
          questionType: q.type as QuestionType,
          difficulty: "BEGINNER",
          answer: userAnswer,
          answerOutline: q.answerOutline,
          exampleAnswer: q.exampleAnswer,
        });
        const score = Math.round((evaluation.score / 100) * q.marks);
        breakdown.push({
          questionId: q.questionId,
          marks: q.marks,
          score,
          isCorrect: evaluation.score >= 75,
          status: usedDeterministic ? (evaluation.score >= 75 ? "correct" : "incorrect") : "pending_ai",
          feedback: (evaluation.criteria || [])[0]?.comment,
          criteria: evaluation.criteria || [],
        });
        totalScore += score;
        if (!usedDeterministic) pendingAiCount++;
      }
    } else {
      breakdown.push({
        questionId: q.questionId,
        marks: q.marks,
        score: 0,
        isCorrect: null,
        status: "unanswered",
        feedback: "Unknown question type",
      });
    }
  }

  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  const passed = percentage >= config.passingScore;

  return { totalScore, maxScore, percentage, passed, breakdown, pendingAiCount };
}

export async function createAssessmentAttempt(
  assessmentId: string,
  userId: string,
  timeLimitMinutes: number
) {
  const deadlineAt = new Date(Date.now() + timeLimitMinutes * 60_000);
  const attempt = await prisma.assessmentAttempt.create({
    data: {
      assessmentId,
      userId,
      deadlineAt,
      status: "IN_PROGRESS",
      maxScore: 0,
    },
  });
  return attempt;
}

export async function saveAnswer(
  attemptId: string,
  questionId: string,
  answerText: string,
  selectedOptionIds: string[] = []
) {
  return prisma.attemptAnswer.upsert({
    where: { attemptId_questionId: { attemptId, questionId } },
    create: { attemptId, questionId, answerText, selectedOptionIds },
    update: { answerText, selectedOptionIds, savedAt: new Date() },
  });
}

export async function markForReview(attemptId: string, questionId: string, marked: boolean) {
  return prisma.attemptAnswer.update({
    where: { attemptId_questionId: { attemptId, questionId } },
    data: { isMarkedForReview: marked },
  });
}

export async function finalizeAttempt(
  attemptId: string,
  config: AssessmentConfig,
  questions: ScoredQuestion[]
) {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: { answers: true },
  });
  if (!attempt) throw new Error("Attempt not found");
  if (attempt.status !== "IN_PROGRESS") throw new Error("Attempt already finalized");

  const answers: AnswerSubmission[] = attempt.answers.map((a) => ({
    questionId: a.questionId,
    answerText: a.answerText,
    selectedOptionIds: a.selectedOptionIds,
  }));

  const result = await scoreAttempt(attemptId, config, questions, answers);

  await prisma.$transaction([
    prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        status: result.pendingAiCount > 0 ? "EVALUATING" : "COMPLETED",
        submittedAt: new Date(),
        score: result.totalScore,
        maxScore: result.maxScore,
        percentage: result.percentage,
        passed: result.passed,
      },
    }),
    prisma.assessmentResult.create({
      data: {
        attemptId,
        totalScore: result.totalScore,
        maxScore: result.maxScore,
        percentage: result.percentage,
        passed: result.passed,
        breakdown: result.breakdown as any,
      },
    }),
  ]);

  return result;
}

export async function expireAttempt(attemptId: string) {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: { answers: true },
  });
  if (!attempt) return null;
  if (attempt.status !== "IN_PROGRESS") return attempt;

  const config = await getAssessmentConfig(attempt.assessmentId);
  if (!config) return null;

  const questions = await getAssessmentQuestions(attempt.assessmentId);
  const answers: AnswerSubmission[] = attempt.answers.map((a) => ({
    questionId: a.questionId,
    answerText: a.answerText,
    selectedOptionIds: a.selectedOptionIds,
  }));

  const result = await scoreAttempt(attemptId, config, questions, answers);

  await prisma.$transaction([
    prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        status: result.pendingAiCount > 0 ? "EVALUATING" : "COMPLETED",
        submittedAt: new Date(),
        score: result.totalScore,
        maxScore: result.maxScore,
        percentage: result.percentage,
        passed: result.passed,
      },
    }),
    prisma.assessmentResult.create({
      data: {
        attemptId,
        totalScore: result.totalScore,
        maxScore: result.maxScore,
        percentage: result.percentage,
        passed: result.passed,
        breakdown: result.breakdown as any,
      },
    }),
  ]);

  return result;
}

export async function getAssessmentConfig(assessmentId: string): Promise<AssessmentConfig | null> {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: {
      timeLimitMinutes: true,
      passingScore: true,
      negativeMarking: true,
      allowBackNavigation: true,
      showExplanationsAfter: true,
      maxAttempts: true,
    },
  });
  if (!assessment) return null;
  return {
    timeLimitMinutes: assessment.timeLimitMinutes,
    passingScore: assessment.passingScore,
    negativeMarking: assessment.negativeMarking,
    allowBackNavigation: assessment.allowBackNavigation,
    showExplanationsAfter: assessment.showExplanationsAfter,
    maxAttempts: assessment.maxAttempts,
  };
}

export async function getAssessmentQuestions(assessmentId: string): Promise<ScoredQuestion[]> {
  const questions = await prisma.assessmentQuestion.findMany({
    where: { assessmentId },
    orderBy: { position: "asc" },
    include: {
      question: {
        select: {
          id: true,
          type: true,
          difficulty: true,
          text: true,
          answerOutline: true,
          explanation: true,
          exampleAnswer: true,
          codeSolution: true,
          codeLanguage: true,
          testCases: true,
          options: { select: { text: true, correct: true } },
        },
      },
    },
  });

  return questions.map((aq) => ({
    questionId: aq.question?.id ?? aq.questionId ?? "",
    marks: aq.marks,
    type: aq.question?.type ?? "SINGLE_ANSWER",
    isRequired: aq.isRequired,
    correctAnswer: aq.question?.options.find((o) => o.correct)?.text,
    answerOutline: aq.question?.answerOutline,
    exampleAnswer: aq.question?.exampleAnswer,
    testCases: aq.question?.testCases as { input: string; expected: string }[] | undefined,
    language: aq.question?.codeLanguage,
    negativeMarking: false,
  }));
}

export async function getAttemptWithDetails(attemptId: string, userId: string) {
  const attempt = await prisma.assessmentAttempt.findFirst({
    where: { id: attemptId, userId },
    include: {
      assessment: true,
      answers: true,
      result: true,
    },
  });
  return attempt;
}

export async function getUserAttempts(userId: string, assessmentId?: string) {
  const where: any = { userId };
  if (assessmentId) where.assessmentId = assessmentId;
  return prisma.assessmentAttempt.findMany({
    where,
    orderBy: { startedAt: "desc" },
    include: {
      assessment: { select: { id: true, title: true, type: true, slug: true } },
      result: true,
    },
  });
}

export async function checkAttemptAccess(attemptId: string, userId: string): Promise<boolean> {
  const attempt = await prisma.assessmentAttempt.findFirst({
    where: { id: attemptId, userId },
  });
  return !!attempt;
}

export { normalizeAnswer, checkMultipleChoice, checkNumeric, checkTrueFalse, scoreToBand };