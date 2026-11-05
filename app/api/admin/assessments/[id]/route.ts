import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrent } from "@/lib/auth/session";
import { db as prisma } from "@/lib/db/client";
import { authorizeRoute } from "@/lib/permissions";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  type: z.enum(["APTITUDE", "TECHNICAL", "CODING", "READINESS"]).optional(),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  careerStages: z.array(z.enum(["STUDENT", "FRESHER", "PROFESSIONAL"])).optional(),
  timeLimitMinutes: z.number().int().positive().max(180).optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
  negativeMarking: z.boolean().optional(),
  allowBackNavigation: z.boolean().optional(),
  showExplanationsAfter: z.boolean().optional(),
  maxAttempts: z.number().int().min(0).max(10).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  sections: z.array(z.object({
    id: z.string().optional(),
    title: z.string().min(1).max(100),
    position: z.number().int().nonnegative(),
    questionCount: z.number().int().positive().max(50),
    _delete: z.boolean().optional(),
  })).optional(),
  questions: z.array(z.object({
    id: z.string().optional(),
    questionId: z.string(),
    sectionPosition: z.number().int().nonnegative().optional(),
    marks: z.number().int().positive().max(100).default(1),
    isRequired: z.boolean().default(true),
    position: z.number().int().nonnegative(),
    _delete: z.boolean().optional(),
  })).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decision = authorizeRoute("/admin/assessments", session);
  if (!decision.allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      sections: { orderBy: { position: "asc" } },
      questions: {
        orderBy: { position: "asc" },
        include: { question: { select: { id: true, text: true, type: true, difficulty: true } } },
      },
      _count: { select: { attempts: true } },
      attempts: { take: 5, orderBy: { startedAt: "desc" }, select: { id: true, status: true, score: true, percentage: true, createdAt: true } },
    },
  });

  if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ assessment });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decision = authorizeRoute("/admin/assessments", session);
  if (!decision.allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;

  const existing = await prisma.assessment.findUnique({ where: { id }, select: { status: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.assessment.update({ where: { id }, data: {
      title: data.title,
      description: data.description,
      type: data.type,
      difficulty: data.difficulty,
      careerStages: data.careerStages,
      timeLimitMinutes: data.timeLimitMinutes,
      passingScore: data.passingScore,
      negativeMarking: data.negativeMarking,
      allowBackNavigation: data.allowBackNavigation,
      showExplanationsAfter: data.showExplanationsAfter,
      maxAttempts: data.maxAttempts,
      status: data.status,
    } });

    if (data.sections) {
      for (const s of data.sections) {
        if (s._delete && s.id) {
          await tx.assessmentSection.delete({ where: { id: s.id } });
        } else if (s.id) {
          await tx.assessmentSection.update({ where: { id: s.id }, data: { title: s.title, position: s.position, questionCount: s.questionCount } });
        } else {
          await tx.assessmentSection.create({ data: { assessmentId: id, title: s.title, position: s.position, questionCount: s.questionCount } });
        }
      }
    }

    if (data.questions) {
      for (const q of data.questions) {
        if (q._delete && q.id) {
          await tx.assessmentQuestion.delete({ where: { id: q.id } });
        } else if (q.id) {
          await tx.assessmentQuestion.update({ where: { id: q.id }, data: { marks: q.marks, isRequired: q.isRequired, position: q.position } });
        } else {
          await tx.assessmentQuestion.create({ data: { assessmentId: id, questionId: q.questionId, marks: q.marks, isRequired: q.isRequired, position: q.position } });
        }
      }
    }
  });

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: { sections: { orderBy: { position: "asc" } }, questions: { orderBy: { position: "asc" } } },
  });

  return NextResponse.json({ assessment });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decision = authorizeRoute("/admin/assessments", session);
  if (!decision.allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.assessment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}