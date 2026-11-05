import "server-only";
import { db } from "@/lib/db/client";
import { getCurrent } from "@/lib/auth/session";
import { readAiConfig } from "@/lib/ai/config";

// Usage limits configuration - can be overridden via env
const LIMITS = {
  questionGeneration: {
    requestsPerDay: Number(process.env.AI_LIMIT_QGEN_REQUESTS_DAY) || 20,
    questionsPerRequest: Number(process.env.AI_LIMIT_QGEN_PER_REQUEST) || 10,
  },
  answerEvaluation: {
    requestsPerDay: Number(process.env.AI_LIMIT_EVAL_REQUESTS_DAY) || 50,
  },
  explanation: {
    requestsPerDay: Number(process.env.AI_LIMIT_EXPLANATION_REQUESTS_DAY) || 30,
  },
  planGeneration: {
    requestsPerDay: Number(process.env.AI_LIMIT_PLAN_REQUESTS_DAY) || 5,
  },
  maxInputLength: Number(process.env.AI_LIMIT_MAX_INPUT_LENGTH) || 50000,
  maxOutputLength: Number(process.env.AI_LIMIT_MAX_OUTPUT_LENGTH) || 8000,
  requestTimeoutMs: Number(process.env.AI_TIMEOUT_MS) || 30000,
  maxRetries: Number(process.env.AI_MAX_RETRIES) || 2,
};

export type OperationType = 
  | "question_generation"
  | "answer_evaluation"
  | "explanation"
  | "plan_generation"
  | "custom_assessment"
  | "mock_interview_plan"
  | "mock_interview_question"
  | "mock_interview_followup"
  | "mock_interview_hint"
  | "mock_interview_evaluation"
  | "mock_interview_report"
  | "mock_interview_create"
  | "mock_interview_complete";

export interface UsageCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
  reason?: string;
}

export interface UsageRecordInput {
  operation: OperationType;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd?: number;
}

function getLimitForOperation(op: OperationType): { requestsPerDay: number } {
  switch (op) {
    case "question_generation":
      return { requestsPerDay: LIMITS.questionGeneration.requestsPerDay };
    case "answer_evaluation":
      return { requestsPerDay: LIMITS.answerEvaluation.requestsPerDay };
    case "explanation":
      return { requestsPerDay: LIMITS.explanation.requestsPerDay };
    case "plan_generation":
      return { requestsPerDay: LIMITS.planGeneration.requestsPerDay };
    case "custom_assessment":
      return { requestsPerDay: 30 };
    case "mock_interview_plan":
    case "mock_interview_question":
    case "mock_interview_followup":
    case "mock_interview_hint":
    case "mock_interview_evaluation":
    case "mock_interview_report":
    case "mock_interview_create":
    case "mock_interview_complete":
      return { requestsPerDay: 50 };
    default:
      return { requestsPerDay: 20 };
  }
}

function getDayStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getDayEnd(): Date {
  const start = getDayStart();
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

/** Check if the current user has remaining quota for an operation. */
export async function checkUsageLimit(operation: OperationType): Promise<UsageCheckResult> {
  const { session, record } = await getCurrent();
  if (!session || !record) {
    return { allowed: false, remaining: 0, limit: 0, resetAt: getDayEnd(), reason: "Unauthorized" };
  }

  const { config } = readAiConfig();
  if (!config.provider) {
    // AI not configured - allow but track separately
    return { allowed: true, remaining: 999, limit: 999, resetAt: getDayEnd() };
  }

  const limit = getLimitForOperation(operation);
  const dayStart = getDayStart();
  const dayEnd = getDayEnd();

  const count = await db.aIUsageRecord.count({
    where: {
      userId: record.id,
      operation,
      createdAt: { gte: dayStart, lt: dayEnd },
    },
  });

  const remaining = Math.max(0, limit.requestsPerDay - count);
  return {
    allowed: remaining > 0,
    remaining,
    limit: limit.requestsPerDay,
    resetAt: dayEnd,
    reason: remaining === 0 ? `Daily limit of ${limit.requestsPerDay} reached for ${operation}` : undefined,
  };
}

/** Record an AI usage event. */
export async function recordUsage(input: UsageRecordInput): Promise<void> {
  const { session, record } = await getCurrent();
  if (!session || !record) return; // Silent fail for logging

  await db.aIUsageRecord.create({
    data: {
      userId: record.id,
      operation: input.operation,
      model: input.model,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      totalTokens: input.inputTokens + input.outputTokens,
      estimatedCostUsd: input.estimatedCostUsd ?? null,
    },
  });
}

/** Get usage statistics for the current user. */
export async function getUserUsageStats(days = 30) {
  const { session, record } = await getCurrent();
  if (!session || !record) return null;

  const since = new Date();
  since.setDate(since.getDate() - days);

  const records = await db.aIUsageRecord.findMany({
    where: { userId: record.id, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });

  const byOperation = new Map<string, { count: number; totalTokens: number; totalCost: number }>();
  for (const r of records) {
    const existing = byOperation.get(r.operation) ?? { count: 0, totalTokens: 0, totalCost: 0 };
    existing.count += 1;
    existing.totalTokens += r.totalTokens;
    existing.totalCost += r.estimatedCostUsd ?? 0;
    byOperation.set(r.operation, existing);
  }

  return {
    totalRequests: records.length,
    totalTokens: records.reduce((sum, r) => sum + r.totalTokens, 0),
    totalEstimatedCost: records.reduce((sum, r) => sum + (r.estimatedCostUsd ?? 0), 0),
    byOperation: Object.fromEntries(byOperation),
    recent: records.slice(0, 20).map((r) => ({
      operation: r.operation,
      model: r.model,
      tokens: r.totalTokens,
      cost: r.estimatedCostUsd,
      createdAt: r.createdAt,
    })),
  };
}

/** Get system-wide usage stats (admin only). */
export async function getSystemUsageStats(days = 7) {
  const { session, record } = await getCurrent();
  if (!session || !record || record.platformRole !== "ADMIN") return null;

  const since = new Date();
  since.setDate(since.getDate() - days);

  const records = await db.aIUsageRecord.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });

  const byUser = new Map<string, { count: number; totalTokens: number; totalCost: number }>();
  const byOperation = new Map<string, { count: number; totalTokens: number; totalCost: number }>();
  const byModel = new Map<string, { count: number; totalTokens: number; totalCost: number }>();

  for (const r of records) {
    const u = byUser.get(r.userId) ?? { count: 0, totalTokens: 0, totalCost: 0 };
    u.count += 1; u.totalTokens += r.totalTokens; u.totalCost += r.estimatedCostUsd ?? 0;
    byUser.set(r.userId, u);

    const o = byOperation.get(r.operation) ?? { count: 0, totalTokens: 0, totalCost: 0 };
    o.count += 1; o.totalTokens += r.totalTokens; o.totalCost += r.estimatedCostUsd ?? 0;
    byOperation.set(r.operation, o);

    const m = byModel.get(r.model) ?? { count: 0, totalTokens: 0, totalCost: 0 };
    m.count += 1; m.totalTokens += r.totalTokens; m.totalCost += r.estimatedCostUsd ?? 0;
    byModel.set(r.model, m);
  }

  return {
    totalRequests: records.length,
    totalTokens: records.reduce((sum, r) => sum + r.totalTokens, 0),
    totalEstimatedCost: records.reduce((sum, r) => sum + (r.estimatedCostUsd ?? 0), 0),
    uniqueUsers: byUser.size,
    byOperation: Object.fromEntries(byOperation),
    byModel: Object.fromEntries(byModel),
    topUsers: Array.from(byUser.entries())
      .sort((a, b) => b[1].totalCost - a[1].totalCost)
      .slice(0, 10)
      .map(([userId, stats]) => ({ userId, ...stats })),
  };
}

/** Validate input/output length limits. */
export function validateLengths(input: string, maxOutput: number): { valid: boolean; error?: string } {
  if (input.length > LIMITS.maxInputLength) {
    return { valid: false, error: `Input exceeds maximum length of ${LIMITS.maxInputLength} characters` };
  }
  if (maxOutput > LIMITS.maxOutputLength) {
    return { valid: false, error: `Requested output exceeds maximum length of ${LIMITS.maxOutputLength} characters` };
  }
  return { valid: true };
}

/** Get current limits configuration (for debugging/admin). */
export function getLimitsConfig() {
  return { ...LIMITS };
}
