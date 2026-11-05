import "server-only";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { generateStructured } from "@/lib/ai/samai-service";
import { planSchema } from "@/lib/ai/schemas";
import { buildContext } from "@/lib/ai/services/context-builder";
import { checkUsageLimit, recordUsage, validateLengths } from "@/lib/ai/services/usage-manager";
import { AiServiceError } from "@/lib/ai/errors";
import { db } from "@/lib/db/client";
import { getCurrent } from "@/lib/auth/session";
import type { CareerStage } from "@/lib/permissions";
import type { Difficulty, Level } from "@/lib/content/types";

const ENHANCED_PLAN_SCHEMA = z.object({
  goal: z.string(),
  recommendedTopics: z.array(z.string()).default([]),
  steps: z.array(z.object({
    title: z.string(),
    description: z.string().default(""),
    estimatedMinutes: z.number().int().min(1).default(15),
    topic: z.string().default(""),
    type: z.enum(["learn", "practice", "review", "mock"]).default("practice"),
    priority: z.enum(["high", "medium", "low"]).default("medium"),
    resources: z.array(z.string()).default([]),
  })).default([]),
  milestones: z.array(z.string()).default([]),
  completionCriteria: z.array(z.string()).default([]),
  rationale: z.string().default(""),
  estimatedTotalHours: z.number().default(0),
  weeklySchedule: z.array(z.object({
    week: z.number().int().min(1),
    focus: z.string(),
    hours: z.number().min(0.5).max(40),
    tasks: z.array(z.string()).default([]),
  })).default([]),
});

export interface PlanInput {
  targetRole?: string;
  careerStage?: CareerStage;
  experienceLevel?: Level;
  goals: string[];
  currentSkills: string[];
  weakTopics: string[];
  availableHoursPerDay: number;
  targetWeeks: number;
  preferredLanguage?: string;
  companyId?: string;
}

export interface PlanResult {
  plan: z.infer<typeof ENHANCED_PLAN_SCHEMA>;
  version: number;
}

function buildPlanPrompt(context: Awaited<ReturnType<typeof buildContext>>, input: PlanInput): string {
  const { user, practice, content } = context;
  
  let prompt = `Create a personalized interview preparation plan.

User Profile:
- Career stage: ${user.careerStage || "not specified"}
- Target role: ${input.targetRole || user.targetRole || "not specified"}
- Experience level: ${input.experienceLevel || user.experienceLevel || "not specified"}
- Education: ${user.educationLevel || "not specified"} ${user.degree ? `(${user.degree})` : ""} ${user.graduationYear ? `Grad: ${user.graduationYear}` : ""}
- Primary language: ${user.primaryProgrammingLanguage || "not specified"}
- Current role: ${user.currentRole || "N/A"}
- Years of experience: ${user.yearsOfExperience ?? "N/A"}
- Skills: ${user.skills.join(", ") || "none listed"}
- Skills to improve: ${input.weakTopics.length ? input.weakTopics.join(", ") : (user.skillsToImprove.join(", ") || "none listed")}
- Goals: ${input.goals.join(", ") || "none"}
- Preferred language: ${input.preferredLanguage || user.preferredLanguage}

Practice History:
- Recent sessions: ${practice.recentSessions.length}
- Weak topics (from evaluations): ${practice.weakTopics.join(", ") || "none identified"}
- Strong topics: ${practice.strongTopics.join(", ") || "none identified"}

Available Content:
- Published questions available: ${content.publishedQuestions.length}
- Topics covered: ${[...new Set(content.publishedQuestions.map((q) => q.topic))].join(", ") || "various"}
`;

  if (input.companyId && content.companies.length > 0) {
    const c = content.companies[0];
    if (c) {
      prompt += `
Target Company:
- Name: ${c.name}
- Industry: ${c.industry}
- Role categories: ${c.roleCategories.join(", ")}
- Prep categories: ${c.prepCategories.join(", ")}
`;
    }
  }

  prompt += `
Requirements:
- Available hours per day: ${input.availableHoursPerDay}
- Target weeks: ${input.targetWeeks}
- Total available hours: ${input.availableHoursPerDay * input.targetWeeks * 7}

Create a structured plan with:
1. A clear goal statement
2. Recommended topics to focus on
3. Step-by-step tasks with estimated time, type (learn/practice/review/mock), priority, and topic
4. Milestones to track progress
5. Completion criteria
6. Rationale for the plan structure
7. Estimated total hours
8. Weekly schedule with focus areas and tasks

Output must be valid JSON matching the schema.`;

  return prompt;
}

export async function createPreparationPlan(input: PlanInput): Promise<PlanResult> {
  await checkUsageLimit("plan_generation");

  const promptPreview = buildPlanPrompt(await buildContext({}), input);
  const lengthCheck = validateLengths(promptPreview, 8000);
  if (!lengthCheck.valid) {
    throw new AiServiceError("INVALID_INPUT", lengthCheck.error || "Plan input too long");
  }

  const context = await buildContext({
    companyId: input.companyId,
  });
  const prompt = buildPlanPrompt(context, input);

  const { object: result, usage } = await generateStructured(ENHANCED_PLAN_SCHEMA, {
    system: "You are an expert interview preparation coach. Create detailed, actionable preparation plans.",
    prompt,
    temperature: 0.3,
    maxTokens: 4000,
  });

  if (usage) {
    await recordUsage({
      operation: "plan_generation",
      model: "unknown",
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
    });
  }

  const version = Date.now();

  // Ensure all fields have defaults
  const planWithDefaults = {
    goal: result.goal || "Interview Preparation Plan",
    recommendedTopics: result.recommendedTopics || [],
    steps: (result.steps || []).map((s) => ({
      title: s.title,
      description: s.description ?? "",
      estimatedMinutes: s.estimatedMinutes ?? 15,
      topic: s.topic ?? "",
      type: s.type ?? "practice",
      priority: s.priority ?? "medium",
      resources: s.resources ?? [],
    })),
    milestones: result.milestones || [],
    completionCriteria: result.completionCriteria || [],
    rationale: result.rationale || "",
    estimatedTotalHours: result.estimatedTotalHours || 0,
    weeklySchedule: (result.weeklySchedule || []).map((week) => ({
      week: week.week,
      focus: week.focus,
      hours: week.hours ?? 0,
      tasks: week.tasks ?? [],
    })),
  };

  return { plan: planWithDefaults as z.infer<typeof ENHANCED_PLAN_SCHEMA>, version };
}

/** Save a preparation plan to the database. */
export async function savePreparationPlan(
  plan: z.infer<typeof ENHANCED_PLAN_SCHEMA>,
  version: number,
  input: PlanInput
): Promise<string> {
  const { session, record } = await getCurrent();
  if (!session || !record) throw new Error("Unauthorized");

  // Archive any existing active plan
  await db.preparationPlan.updateMany({
    where: { userId: record.id, status: "ACTIVE" },
    data: { status: "ARCHIVED" },
  });

  // Create new plan
  const newPlan = await db.preparationPlan.create({
    data: {
      userId: record.id,
      status: "ACTIVE",
      version,
      goal: plan.goal,
      versions: {
        create: {
          version,
          snapshot: plan as Prisma.InputJsonValue,
        },
      },
      tasks: {
        create: plan.steps.map((step, index) => ({
          position: index,
          title: step.title,
          description: step.description,
          topic: step.topic,
          estimatedMinutes: step.estimatedMinutes,
          status: "TODO",
        })),
      },
    },
    select: { id: true },
  });

  return newPlan.id;
}

/** Get the current active plan for the user. */
export async function getActivePlan() {
  const { session, record } = await getCurrent();
  if (!session || !record) return null;

  return db.preparationPlan.findFirst({
    where: { userId: record.id, status: "ACTIVE" },
    include: {
      tasks: { orderBy: { position: "asc" } },
      versions: { orderBy: { version: "desc" }, take: 5 },
    },
  });
}

/** Update a plan task status. */
export async function updatePlanTask(taskId: string, status: "TODO" | "DONE") {
  const { session, record } = await getCurrent();
  if (!session || !record) throw new Error("Unauthorized");

  const task = await db.preparationPlanTask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Task not found");

  const plan = await db.preparationPlan.findUnique({ where: { id: task.planId } });
  if (!plan || plan.userId !== record.id) throw new Error("Forbidden");

  return db.preparationPlanTask.update({
    where: { id: taskId },
    data: {
      status,
      completedAt: status === "DONE" ? new Date() : null,
    },
  });
}

/** Get plan progress statistics. */
export async function getPlanProgress(planId: string) {
  const { session, record } = await getCurrent();
  if (!session || !record) return null;

  const plan = await db.preparationPlan.findUnique({ where: { id: planId } });
  if (!plan || plan.userId !== record.id) return null;

  const tasks = await db.preparationPlanTask.findMany({ where: { planId } });
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "DONE").length;
  const totalMinutes = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const doneMinutes = tasks.filter((t) => t.status === "DONE").reduce((sum, t) => sum + t.estimatedMinutes, 0);

  return {
    totalTasks: total,
    completedTasks: done,
    completionRate: total > 0 ? done / total : 0,
    totalEstimatedHours: Math.round(totalMinutes / 60 * 10) / 10,
    completedEstimatedHours: Math.round(doneMinutes / 60 * 10) / 10,
    tasks,
  };
}
