import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrent } from "@/lib/auth/session";
import { db as prisma } from "@/lib/db/client";
import { checkUsageLimit, recordUsage } from "@/lib/ai/services/usage-manager";
import { AiServiceError } from "@/lib/ai/errors";

const createCustomSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  topicIds: z.array(z.string()).min(1).max(10).optional(),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  questionTypes: z.array(z.enum([
    "MULTIPLE_CHOICE", "SINGLE_ANSWER", "SHORT_ANSWER", "LONG_ANSWER",
    "CODING", "SQL", "SCENARIO", "BEHAVIORAL", "SYSTEM_DESIGN", "COMMUNICATION"
  ])).max(5).optional(),
  questionCount: z.number().int().positive().max(50).default(10),
  timeLimitMinutes: z.number().int().positive().max(180).default(30),
  passingScore: z.number().int().min(0).max(100).default(60),
  negativeMarking: z.boolean().default(false),
  programmingLanguage: z.string().optional(),
});

const listCustomSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
});

export async function POST(req: Request) {
  const { session, record } = await getCurrent();
  if (!session || !record) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createCustomSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const usageCheck = await checkUsageLimit("custom_assessment");
  if (!usageCheck.allowed) {
    return NextResponse.json({ error: usageCheck.reason || "Custom assessment limit reached" }, { status: 429 });
  }

  const input = parsed.data;
  const where: Record<string, any> = { publication: "PUBLISHED" };
  if (input.topicIds?.length) where.categoryId = { in: input.topicIds };
  if (input.difficulty) where.difficulty = input.difficulty;
  if (input.questionTypes?.length) where.type = { in: input.questionTypes };
  if (input.programmingLanguage && (input.questionTypes?.includes("CODING") || input.questionTypes?.includes("SQL"))) {
    where.codeLanguage = input.programmingLanguage;
  }

  const totalQuestions = await prisma.question.count({ where });
  if (totalQuestions === 0) {
    return NextResponse.json({ error: "No questions match your criteria" }, { status: 400 });
  }

  const count = Math.min(input.questionCount, totalQuestions);
  const skip = Math.floor(Math.random() * Math.max(1, totalQuestions - count + 1));

  const questions = await prisma.question.findMany({
    where,
    skip,
    take: count,
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });

  const assessment = await prisma.assessment.create({
    data: {
      slug: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: input.title,
      description: input.description ?? "",
      type: "CUSTOM",
      difficulty: input.difficulty ?? "BEGINNER",
      careerStages: record.careerStage ? [record.careerStage] : ["STUDENT", "FRESHER", "PROFESSIONAL"],
      status: "PUBLISHED",
      timeLimitMinutes: input.timeLimitMinutes,
      passingScore: input.passingScore,
      negativeMarking: input.negativeMarking,
      allowBackNavigation: true,
      showExplanationsAfter: true,
      maxAttempts: 0,
      questions: {
        create: questions.map((q, i) => ({
          questionId: q.id,
          position: i,
          marks: 1,
          isRequired: true,
        })),
      },
    },
    select: { id: true, slug: true, title: true, timeLimitMinutes: true },
  });

  await recordUsage({ operation: "custom_assessment", model: "internal", inputTokens: 0, outputTokens: 0 });

  return NextResponse.json({ assessment });
}

export async function GET(req: Request) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const parsed = listCustomSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const { page, pageSize } = parsed.data;

  const where: Record<string, any> = { type: "CUSTOM" };
  const [assessments, total] = await Promise.all([
    prisma.assessment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        difficulty: true,
        timeLimitMinutes: true,
        passingScore: true,
        createdAt: true,
        _count: { select: { questions: true, attempts: true } },
      },
    }),
    prisma.assessment.count({ where }),
  ]);

  return NextResponse.json({
    assessments,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}