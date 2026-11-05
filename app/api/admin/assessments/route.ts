import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrent } from "@/lib/auth/session";
import { db as prisma } from "@/lib/db/client";
import { authorizeRoute } from "@/lib/permissions";

const createAssessmentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  type: z.enum(["APTITUDE", "TECHNICAL", "CODING", "READINESS"]),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER"),
  careerStages: z.array(z.enum(["STUDENT", "FRESHER", "PROFESSIONAL"])).min(1),
  timeLimitMinutes: z.number().int().positive().max(180).default(30),
  passingScore: z.number().int().min(0).max(100).default(60),
  negativeMarking: z.boolean().default(false),
  allowBackNavigation: z.boolean().default(true),
  showExplanationsAfter: z.boolean().default(true),
  maxAttempts: z.number().int().min(0).max(10).default(0),
  sections: z.array(z.object({
    title: z.string().min(1).max(100),
    questionCount: z.number().int().positive().max(50),
  })).optional(),
  questions: z.array(z.object({
    questionId: z.string(),
    sectionPosition: z.number().int().nonnegative().optional(),
    marks: z.number().int().positive().max(100).default(1),
    isRequired: z.boolean().default(true),
  })).optional(),
});

const listSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  type: z.enum(["APTITUDE", "TECHNICAL", "CODING", "READINESS", "CUSTOM"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export async function GET(req: Request) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decision = authorizeRoute("/admin/assessments", session);
  if (!decision.allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const parsed = listSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const { status, type, page, pageSize } = parsed.data;
  const where: Record<string, any> = {};
  if (status) where.status = status;
  if (type) where.type = type;

  const [assessments, total] = await Promise.all([
    prisma.assessment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { questions: true, attempts: true } },
        sections: { orderBy: { position: "asc" }, select: { id: true, title: true, position: true, questionCount: true } },
      },
    }),
    prisma.assessment.count({ where }),
  ]);

  return NextResponse.json({ assessments, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
}

export async function POST(req: Request) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decision = authorizeRoute("/admin/assessments", session);
  if (!decision.allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = createAssessmentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const baseSlug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const slug = `${baseSlug}-${Date.now()}`;

  const assessment = await prisma.assessment.create({
    data: {
      slug,
      title: data.title,
      description: data.description ?? "",
      type: data.type,
      difficulty: data.difficulty,
      careerStages: data.careerStages,
      status: "DRAFT",
      timeLimitMinutes: data.timeLimitMinutes,
      passingScore: data.passingScore,
      negativeMarking: data.negativeMarking,
      allowBackNavigation: data.allowBackNavigation,
      showExplanationsAfter: data.showExplanationsAfter,
      maxAttempts: data.maxAttempts,
      sections: data.sections
        ? { create: data.sections.map((s, i) => ({ title: s.title, position: i, questionCount: s.questionCount })) }
        : undefined,
      questions: data.questions
        ? { create: data.questions.map((q, i) => ({ questionId: q.questionId, position: i, marks: q.marks, isRequired: q.isRequired })) }
        : undefined,
    },
    include: { sections: true, questions: { include: { question: { select: { id: true, text: true, type: true } } } } },
  });

  return NextResponse.json({ assessment }, { status: 201 });
}