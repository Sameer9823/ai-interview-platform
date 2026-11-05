import "server-only";
import { PrismaClient, MockInterviewStatus } from "@prisma/client";

const prisma = new PrismaClient();

export interface CreateVoiceConsentLogInput {
  userId: string;
  sessionId?: string;
  version: string;
  accepted: boolean;
  ipHash?: string;
  userAgent?: string;
}

export async function createVoiceConsentLog(input: CreateVoiceConsentLogInput) {
  return prisma.voiceConsentLog.create({
    data: {
      userId: input.userId,
      sessionId: input.sessionId,
      version: input.version,
      accepted: input.accepted,
      ipHash: input.ipHash,
      userAgent: input.userAgent,
    },
  });
}

export async function updateVoiceConsentLog(consentId: string, data: Partial<{
  accepted: boolean;
  ipHash: string;
  userAgent: string;
}>) {
  return prisma.voiceConsentLog.update({
    where: { id: consentId },
    data,
  });
}

export async function getUserConsentHistory(userId: string) {
  return prisma.voiceConsentLog.findMany({
    where: { userId: userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getLatestConsent(userId: string) {
  return prisma.voiceConsentLog.findFirst({
    where: { userId: userId, accepted: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function hasValidConsent(userId: string, version: string = "1.0"): Promise<boolean> {
  const consent = await getLatestConsent(userId);
  return consent !== null && consent.version === version && consent.accepted;
}

export async function recordVoiceUsage(input: {
  userId: string;
  sessionId?: string;
  operation: string;
  provider: string;
  model?: string;
  audioDurationMs?: number;
  characters?: number;
  estimatedCostUsd?: number;
}) {
  return prisma.voiceUsageRecord.create({
    data: {
      userId: input.userId,
      sessionId: input.sessionId,
      operation: input.operation,
      provider: input.provider,
      model: input.model,
      audioDurationMs: input.audioDurationMs,
      characters: input.characters,
      estimatedCostUsd: input.estimatedCostUsd,
    },
  });
}

export async function getVoiceUsageStats(userId: string) {
  const records = await prisma.voiceUsageRecord.findMany({
    where: { userId: userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totalCost = records.reduce((sum, r) => sum + (r.estimatedCostUsd || 0), 0);
  const totalAudioMs = records.reduce((sum, r) => sum + (r.audioDurationMs || 0), 0);
  const totalChars = records.reduce((sum, r) => sum + (r.characters || 0), 0);

  const byOperation = records.reduce((acc, r) => {
    acc[r.operation] = (acc[r.operation] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalRequests: records.length,
    totalCostUsd: totalCost,
    totalAudioMinutes: totalAudioMs / 60000,
    totalCharacters: totalChars,
    byOperation,
  };
}

export async function cleanupOldVoiceData(userId: string, olderThanDays: number = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  // Find old voice sessions
  const whereClause1 = {
    session: {
      userId: userId,
      createdAt: { lt: cutoffDate },
      status: { in: ["COMPLETED", "CANCELLED", "EXPIRED"] as MockInterviewStatus[] },
    },
  };
  const oldSessions = await prisma.voiceSession.findMany({
    where: whereClause1,
  });

  // Delete associated data
  for (const session of oldSessions) {
    // Delete captures and related data
    await prisma.voiceCapture.deleteMany({
      where: { voiceSessionId: session.id },
    });

    await prisma.voiceProcessingJob.deleteMany({
      where: { sessionId: session.id },
    });
  }

  // Delete old voice sessions
  const whereClause2 = {
    session: {
      userId: userId,
      createdAt: { lt: cutoffDate },
      status: { in: ["COMPLETED", "CANCELLED", "EXPIRED"] as MockInterviewStatus[] },
    },
  };
  await prisma.voiceSession.deleteMany({
    where: whereClause2,
  });

  // Clean up old usage records
  const whereClause3 = {
    userId: userId,
    createdAt: { lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
  };
  await prisma.voiceUsageRecord.deleteMany({
    where: whereClause3,
  });
}

export function estimateTranscriptionCost(
  provider: string,
  audioDurationMinutes: number
): number {
  const rates: Record<string, number> = {
    openai: 0.006,
    deepgram: 0.0043,
    assemblyai: 0.00025,
  };

  const rate = rates[provider.toLowerCase()] || 0.006;
  return audioDurationMinutes * rate;
}

export function estimateSynthesisCost(
  provider: string,
  characters: number
): number {
  const rates: Record<string, number> = {
    openai: 0.000015,
    elevenlabs: 0.0003,
    google: 0.000016,
    azure: 0.000016,
  };

  const rate = rates[provider.toLowerCase()] || 0.000015;
  return characters * rate;
}