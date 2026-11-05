import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrent } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { evaluateAnswer } from "@/lib/ai/services/answer-evaluator";
import { AiServiceError } from "@/lib/ai/errors";
import type { QuestionType, Difficulty } from "@/lib/content/types";

const submitAnswerSchema = z.object({
  sessionId: z.string(),
  questionRef: z.string(),
  answerText: z.string().min(1).max(20000),
  evaluate: z.boolean().default(true),
  forceReevaluate: z.boolean().default(false),
  questionType: z.string().min(1).max(50).optional(),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  questionText: z.string().max(10000).optional(),
  answerOutline: z.string().max(10000).optional(),
  exampleAnswer: z.string().max(10000).optional(),
  correctAnswer: z.string().max(5000).optional(),
});

export async function POST(req: Request) {
  const { session, record } = await getCurrent();
  if (!session || !record) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = submitAnswerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { sessionId, questionRef, answerText, evaluate, forceReevaluate, questionType, difficulty, questionText, answerOutline, exampleAnswer, correctAnswer } = parsed.data;

  // Verify session ownership
  const practiceSession = await db.practiceSession.findUnique({
    where: { id: sessionId },
    include: { questions: true },
  });

  if (!practiceSession || practiceSession.userId !== record.id) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Verify question belongs to session
  const sessionQuestion = practiceSession.questions.find(
    (q) => q.questionId === questionRef || q.generatedQuestionId === questionRef
  );
  if (!sessionQuestion) {
    return NextResponse.json({ error: "Question not in session" }, { status: 400 });
  }

  // Check for existing answer (idempotent)
  const existingAnswer = await db.userPracticeAnswer.findFirst({
    where: { sessionId, questionRef },
    include: { evaluation: true },
  });

  if (existingAnswer) {
    // Return existing answer with evaluation if already evaluated
    if (existingAnswer.evaluation && !forceReevaluate) {
      return NextResponse.json({ answer: existingAnswer, evaluation: existingAnswer.evaluation });
    }
  }

  // Create or update answer
  const answer = await db.userPracticeAnswer.upsert({
    where: { sessionId_questionRef: { sessionId, questionRef } },
    create: { sessionId, questionRef, answerText },
    update: { answerText, submittedAt: new Date() },
    include: { evaluation: true },
  });

  // Evaluate if requested and not already evaluated
  let evaluation = answer.evaluation;
  if (evaluate && (!evaluation || forceReevaluate)) {
    // Fetch question details for evaluation
    let qText = questionText;
    let qType = questionType;
    let qDifficulty = difficulty;
    let aOutline = answerOutline;
    let eAnswer = exampleAnswer;
    let cAnswer = correctAnswer;

    if (sessionQuestion.questionId) {
      const q = await db.question.findUnique({ where: { id: sessionQuestion.questionId }, include: { options: true } });
      if (q) {
        qText = q.text;
        qType = q.type;
        qDifficulty = q.difficulty;
        aOutline = q.answerOutline;
        eAnswer = q.exampleAnswer;
        if ((q.type === "MULTIPLE_CHOICE" || q.type === "SINGLE_ANSWER") && q.options.length > 0) {
          cAnswer = q.options.filter((o) => o.correct).map((o) => o.text).join(", ");
        }
      }
    } else if (sessionQuestion.generatedQuestionId) {
      const gq = await db.generatedPracticeQuestion.findUnique({ where: { id: sessionQuestion.generatedQuestionId } });
      if (gq) {
        qText = gq.text;
        qType = gq.type;
        qDifficulty = gq.difficulty;
        aOutline = gq.answerOutline;
        eAnswer = gq.exampleAnswer;
      }
    }

    if (qText && qType && qDifficulty) {
      try {
        const result = await evaluateAnswer({
          question: qText,
          questionType: qType as QuestionType,
          difficulty: qDifficulty as Difficulty,
          answer: answerText,
          answerOutline: aOutline,
          exampleAnswer: eAnswer,
          userContext: { careerStage: record.careerStage ?? undefined },
        });

        // Save evaluation
        evaluation = await db.answerEvaluation.upsert({
          where: { answerId: answer.id },
          create: {
            answerId: answer.id,
            score: result.evaluation.score,
            band: result.evaluation.band,
            criteria: result.evaluation.criteria as any,
            strengths: result.evaluation.strengths,
            missing: result.evaluation.missing,
            incorrect: result.evaluation.incorrect,
            improvements: result.evaluation.improvements,
            modelAnswer: result.evaluation.modelAnswer,
            nextSteps: result.evaluation.nextSteps,
            confidence: result.evaluation.confidence,
          },
          update: {
            score: result.evaluation.score,
            band: result.evaluation.band,
            criteria: result.evaluation.criteria as any,
            strengths: result.evaluation.strengths,
            missing: result.evaluation.missing,
            incorrect: result.evaluation.incorrect,
            improvements: result.evaluation.improvements,
            modelAnswer: result.evaluation.modelAnswer,
            nextSteps: result.evaluation.nextSteps,
            confidence: result.evaluation.confidence,
          },
        });
      } catch (e) {
        if (e instanceof AiServiceError) {
          console.warn("Evaluation failed:", e.message);
        } else {
          console.error("Evaluation error:", e);
        }
      }
    }
  }

  return NextResponse.json({ answer, evaluation });
}
