import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrent } from "@/lib/auth/session";
import { createPreparationPlan, savePreparationPlan, getActivePlan, getPlanProgress, PlanInput } from "@/lib/ai/services/preparation-planner";
import { AiServiceError } from "@/lib/ai/errors";
import { db } from "@/lib/db/client";

const createPlanSchema = z.object({
  targetRole: z.string().max(100).optional(),
  careerStage: z.enum(["STUDENT", "FRESHER", "PROFESSIONAL"]).optional(),
  experienceLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  goals: z.array(z.string()).min(1).max(10),
  currentSkills: z.array(z.string().max(40)).max(20).default([]),
  weakTopics: z.array(z.string().max(100)).max(20).default([]),
  availableHoursPerDay: z.number().min(0.5).max(12).default(2),
  targetWeeks: z.number().int().min(1).max(52).default(4),
  preferredLanguage: z.string().max(10).default("en"),
  companyId: z.string().optional(),
});

export async function POST(req: Request) {
  const { session, record } = await getCurrent();
  if (!session || !record) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createPlanSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const input: PlanInput = {
    targetRole: parsed.data.targetRole,
    careerStage: parsed.data.careerStage,
    experienceLevel: parsed.data.experienceLevel,
    goals: parsed.data.goals,
    currentSkills: parsed.data.currentSkills,
    weakTopics: parsed.data.weakTopics,
    availableHoursPerDay: parsed.data.availableHoursPerDay,
    targetWeeks: parsed.data.targetWeeks,
    preferredLanguage: parsed.data.preferredLanguage,
    companyId: parsed.data.companyId,
  };

  try {
    const result = await createPreparationPlan(input);
    const planId = await savePreparationPlan(result.plan, result.version, input);
    return NextResponse.json({ planId, plan: result.plan, version: result.version });
  } catch (e) {
    if (e instanceof AiServiceError) {
      const status = e.code === "NOT_CONFIGURED" ? 503 : e.code === "RATE_LIMITED" ? 429 : 502;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    console.error("Plan generation failed:", e);
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }
}

export async function GET() {
  const { session, record } = await getCurrent();
  if (!session || !record) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = await getActivePlan();
  if (!plan) {
    return NextResponse.json({ plan: null });
  }

  const progress = await getPlanProgress(plan.id);
  return NextResponse.json({ plan, progress });
}
