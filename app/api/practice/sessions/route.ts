import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrent } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import type { Difficulty, QuestionType } from "@/lib/content/types";

type PracticeStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED";

const createSessionSchema = z.object({
  title: z.string().max(200).default(""),
  topic: z.string().min(1).max(100),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  questionType: z.string().min(1).max(50).optional(),
  questionIds: z.array(z.string()).max(20).default([]),
  generatedQuestionIds: z.array(z.string()).max(20).default([]),
});

export async function POST(req: Request) {
  const { session, record } = await getCurrent();
  if (!session || !record) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createSessionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  // Validate question ownership/access
  const allQuestionIds = [...parsed.data.questionIds, ...parsed.data.generatedQuestionIds];
  if (allQuestionIds.length === 0) {
    return NextResponse.json({ error: "At least one question is required" }, { status: 400 });
  }

  // Check published questions
  const publishedQuestions = await db.question.findMany({
    where: { id: { in: parsed.data.questionIds }, publication: "PUBLISHED" },
    select: { id: true },
  });

  // Check generated questions (must belong to user)
  const generatedQuestions = await db.generatedPracticeQuestion.findMany({
    where: { id: { in: parsed.data.generatedQuestionIds }, userId: record.id },
    select: { id: true },
  });

  const validQuestionIds = publishedQuestions.map((q) => q.id);
  const validGeneratedIds = generatedQuestions.map((q) => q.id);

  if (validQuestionIds.length + validGeneratedIds.length === 0) {
    return NextResponse.json({ error: "No valid questions found" }, { status: 400 });
  }

  // Create session
  const practiceSession = await db.practiceSession.create({
    data: {
      userId: record.id,
      title: parsed.data.title || `Practice: ${parsed.data.topic}`,
      topic: parsed.data.topic,
      difficulty: parsed.data.difficulty,
      questionType: parsed.data.questionType as QuestionType | undefined,
      status: "IN_PROGRESS",
      questions: {
        create: [
          ...validQuestionIds.map((id, index) => ({
            position: index,
            questionId: id,
          })),
          ...validGeneratedIds.map((id, index) => ({
            position: validQuestionIds.length + index,
            generatedQuestionId: id,
          })),
        ],
      },
    },
    include: {
      questions: {
        orderBy: { position: "asc" },
        include: {
          generatedQuestion: true,
        },
      },
    },
  });

  return NextResponse.json({ session: practiceSession });
}

export async function GET(req: Request) {
  const { session, record } = await getCurrent();
  if (!session || !record) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const pageSize = Math.min(parseInt(url.searchParams.get("pageSize") || "10", 10), 50);
  const status = url.searchParams.get("status") as PracticeStatus | null;

  const where: Record<string, unknown> = { userId: record.id };
  if (status) where.status = status;

  const [sessions, total] = await Promise.all([
    db.practiceSession.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        questions: { orderBy: { position: "asc" } },
        answers: { include: { evaluation: true } },
      },
    }),
    db.practiceSession.count({ where }),
  ]);

  return NextResponse.json({
    sessions,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
