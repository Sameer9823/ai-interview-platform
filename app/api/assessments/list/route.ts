import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrent } from "@/lib/auth/session";
import { db as prisma } from "@/lib/db/client";

const querySchema = z.object({
  type: z.enum(["APTITUDE", "TECHNICAL", "CODING", "READINESS", "CUSTOM"]).optional(),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  careerStage: z.enum(["STUDENT", "FRESHER", "PROFESSIONAL"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
  search: z.string().optional(),
});

export async function GET(req: Request) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const { type, difficulty, careerStage, page, pageSize, search } = parsed.data;

  const where: Record<string, any> = { status: "PUBLISHED" };
  if (type) where.type = type;
  if (difficulty) where.difficulty = difficulty;
  if (careerStage) where.careerStages = { has: careerStage };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

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
        type: true,
        difficulty: true,
        careerStages: true,
        timeLimitMinutes: true,
        passingScore: true,
        negativeMarking: true,
        maxAttempts: true,
        createdAt: true,
        _count: { select: { questions: true, attempts: true } },
      },
    }),
    prisma.assessment.count({ where }),
  ]);

  return NextResponse.json({
    assessments,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}