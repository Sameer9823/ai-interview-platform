import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrent } from "@/lib/auth/session";
import { getUserAttempts } from "@/lib/ai/services/assessment-engine";

const querySchema = z.object({
  assessmentId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
});

export async function GET(req: Request) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const { assessmentId, page, pageSize } = parsed.data;

  const attempts = await getUserAttempts(session.id, assessmentId);

  const total = attempts.length;
  const paginated = attempts.slice((page - 1) * pageSize, page * pageSize);

  return NextResponse.json({
    attempts: paginated.map((a) => ({
      id: a.id,
      status: a.status,
      assessment: a.assessment,
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
      score: a.score,
      maxScore: a.maxScore,
      percentage: a.percentage,
      passed: a.passed,
      result: a.result
        ? {
            totalScore: (a.result as any).totalScore,
            maxScore: (a.result as any).maxScore,
            percentage: (a.result as any).percentage,
            passed: (a.result as any).passed,
          }
        : null,
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}