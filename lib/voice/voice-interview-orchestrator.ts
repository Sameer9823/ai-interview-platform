import "server-only";
import { PrismaClient } from "@prisma/client";
import { TranscriptionProvider, SynthesisProvider } from "./voice-provider";
import { getAiClient, generateStructured, generateText } from "@/lib/ai/samai-service";
import { AiServiceError } from "@/lib/ai/errors";
import { createTranscriptionProvider } from "./transcription-service";
import { createSynthesisProvider } from "./synthesis-service";
import { createVoiceConsentLog, updateVoiceConsentLog } from "@/lib/voice/consent-service";

const prisma = new PrismaClient();

export interface VoiceInterviewConfig {
  mode: string;
  targetRole?: string;
  careerLevel?: string;
  companyId?: string;
  resumeVersionId?: string;
  jobDescription?: string;
  durationMinutes: number;
  questionCount: number;
  topics: string[];
  skills: string[];
  codingLanguage?: string;
  feedbackMode: string;
  interviewStyle: string;
  difficulty: string;
  voiceMode: "TEXT_ONLY" | "VOICE_ONLY" | "HYBRID";
  voiceProvider?: string;
  transcriptionProvider?: string;
  language?: string;
  voiceId?: string;
  deliveryAnalyticsEnabled?: boolean;
}

export interface VoiceSessionData {
  voiceSessionId: string;
  mockSessionId: string;
  voiceMode: "TEXT_ONLY" | "VOICE_ONLY" | "HYBRID";
  voiceProvider: string;
  transcriptionProvider: string;
  language: string;
  voiceId?: string;
  deliveryAnalyticsEnabled: boolean;
}

export async function createVoiceInterview(input: VoiceInterviewConfig & { userId: string }) {
  // First create the base mock interview
  const { createMockInterview } = await import("@/lib/ai/services/mock-interview-orchestrator");
  const mockSession = await createMockInterview({
    userId: input.userId,
    mode: input.mode,
    targetRole: input.targetRole,
    careerLevel: input.careerLevel,
    companyId: input.companyId,
    resumeVersionId: input.resumeVersionId,
    jobDescription: input.jobDescription,
    durationMinutes: input.durationMinutes,
    questionCount: input.questionCount,
    topics: input.topics,
    skills: input.skills,
    codingLanguage: input.codingLanguage,
    feedbackMode: input.feedbackMode,
    interviewStyle: input.interviewStyle,
    difficulty: input.difficulty,
  });

  // Create voice session linked to mock interview
  const voiceSession = await prisma.voiceSession.create({
    data: {
      sessionId: mockSession.id,
      voiceMode: input.voiceMode as any,
      voiceProvider: (input.voiceProvider || "BROWSER_NATIVE") as any,
      transcriptionProvider: (input.transcriptionProvider || "BROWSER_NATIVE") as any,
      language: input.language || "en-US",
      voiceId: input.voiceId,
      deliveryAnalyticsEnabled: input.deliveryAnalyticsEnabled || false,
      processingStatus: "IDLE",
    },
  });

  // Log consent
  await createVoiceConsentLog({
    userId: input.userId,
    sessionId: mockSession.id,
    version: "1.0",
    accepted: true,
  });

  return { mockSession, voiceSession };
}

export async function getVoiceSession(sessionId: string, userId: string) {
  const mockSession = await prisma.mockInterviewSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      voiceSession: true,
      questions: { orderBy: { sequenceNumber: "asc" } },
      answers: { orderBy: { submittedAt: "asc" } },
      evaluations: true,
      report: true,
    },
  });

  if (!mockSession) return null;

  return {
    mockSession,
    voiceSession: mockSession.voiceSession,
  };
}

export async function updateVoiceSessionProcessingStatus(
  voiceSessionId: string,
  status: string
) {
  await prisma.voiceSession.update({
    where: { id: voiceSessionId },
    data: { processingStatus: status },
  });
}

export async function createVoiceCapture(
  voiceSessionId: string,
  questionId: string,
  mimeType: string
) {
  const capture = await prisma.voiceCapture.create({
    data: {
      voiceSessionId,
      questionId,
      captureStatus: "RECORDING",
      mimeType,
    },
  });
  return capture;
}

export async function completeVoiceCapture(
  captureId: string,
  data: {
    audioDuration?: number;
    storageKey?: string;
    mimeType?: string;
  }
) {
  return prisma.voiceCapture.update({
    where: { id: captureId },
    data: {
      captureStatus: "COMPLETED",
      audioDuration: data.audioDuration,
      storageKey: data.storageKey,
      mimeType: data.mimeType,
      updatedAt: new Date(),
    },
  });
}

export async function failVoiceCapture(captureId: string, errorMessage: string) {
  return prisma.voiceCapture.update({
    where: { id: captureId },
    data: {
      captureStatus: "FAILED",
      errorMessage: errorMessage,
    },
  });
}

export async function createVoiceProcessingJob(
  sessionId: string,
  type: "TRANSCRIBE" | "SYNTHESIZE" | "ANALYZE",
  inputJson?: any,
  captureId?: string
) {
  return prisma.voiceProcessingJob.create({
    data: {
      sessionId,
      captureId,
      type,
      status: "PENDING",
    },
  });
}

export async function processTranscriptionJob(jobId: string) {
  const job = await prisma.voiceProcessingJob.findUnique({
    where: { id: jobId },
    include: {
      session: true,
      capture: true,
    },
  });

  if (!job || !job.capture) return;

  try {
    await prisma.voiceProcessingJob.update({
      where: { id: jobId },
      data: { status: "IN_PROGRESS", startedAt: new Date() },
    });

    // Get audio from storage
    // In a real implementation, you would download from storage
    // For now, we'll assume the audio is available as a buffer
    const audioBuffer = (job.inputJson as any)?.audioBuffer ? Buffer.from((job.inputJson as any).audioBuffer) : Buffer.alloc(0);

    // Get transcription provider
    const voiceSession = await prisma.voiceSession.findUnique({
      where: { sessionId: job.sessionId },
    });

    if (!voiceSession) throw new Error("Voice session not found");

    const provider = createTranscriptionProvider(
      voiceSession.transcriptionProvider || "BROWSER_NATIVE",
      process.env.OPENAI_API_KEY || process.env.DEEPGRAM_API_KEY || process.env.ASSEMBLYAI_API_KEY
    ) as TranscriptionProvider;

    // Transcribe
    const result = await provider.transcribe(audioBuffer as Buffer, {
      language: voiceSession.language,
    });

    // Save transcript
    const transcript = await prisma.voiceTranscript.create({
      data: {
        captureId: job.captureId!,
        fullText: result.text,
        language: result.language || "en-US",
        confidence: result.confidence,
        isFinal: result.isFinal,
        provider: voiceSession.transcriptionProvider || "BROWSER_NATIVE",
        segments: result.segments ? {
          create: result.segments.map((s, i) => ({
            index: i,
            text: s.text,
            startMs: s.startMs,
            endMs: s.endMs,
            confidence: s.confidence,
            isFinal: true,
          }))
        } : undefined,
      },
    });

    // Update capture with transcript
    await prisma.voiceCapture.update({
      where: { id: job.captureId! },
      data: { captureStatus: "COMPLETED" },
    });

    // Update job
    await prisma.voiceProcessingJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        outputJson: { transcriptId: transcript.id, text: result.text },
        completedAt: new Date(),
      },
    });

    // If delivery analytics enabled, run analysis
    const voiceSessionData = await prisma.voiceSession.findUnique({
      where: { id: job.sessionId },
    });

    if (voiceSessionData?.deliveryAnalyticsEnabled && job.captureId) {
      await createVoiceAnalysisJob(job.captureId, result);
    }

    return transcript;
  } catch (error) {
    await prisma.voiceProcessingJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      },
    });

    if (job.captureId) {
      await failVoiceCapture(job.captureId, error instanceof Error ? error.message : "Unknown error");
    }

    throw error;
  }
}

async function createVoiceAnalysisJob(captureId: string, transcriptResult: any) {
  // This would create a voice analysis job
  // For now, we'll create a basic analysis
  const capture = await prisma.voiceCapture.findUnique({
    where: { id: captureId },
    include: { transcript: true },
  });

  if (!capture || !capture.transcript) return;

  const transcript = capture.transcript;
  const words = transcript.fullText.split(/\s+/).filter(Boolean).length;
  const durationMinutes = capture.audioDuration || 0;
  const wordsPerMinute = durationMinutes > 0 ? words / (durationMinutes / 60) : 0;

  // Simple filler word detection
  const fillerWords = ["um", "uh", "er", "ah", "like", "you know", "so", "actually", "basically", "literally"];
  const fillerWordCount = fillerWords.reduce((count, word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    const matches = transcript.fullText.match(regex);
    return count + (matches?.length || 0);
  }, 0);

  await prisma.voiceAnalysis.create({
    data: {
      captureId: capture.id,
      version: "1.0",
      speakingDurationMs: capture.audioDuration ? capture.audioDuration * 1000 : undefined,
      wordsPerMinute: wordsPerMinute > 0 ? wordsPerMinute : undefined,
      fillerWordCount: fillerWordCount > 0 ? fillerWordCount : undefined,
      fillerWords: fillerWordCount > 0 ? { detected: fillerWords.filter(w => new RegExp(`\\b${w}\\b`, "gi").test(transcript.fullText)) } : undefined,
      reliability: "MEDIUM",
    },
  });
}

export async function synthesizeInterviewerResponse(
  sessionId: string,
  text: string,
  voiceId?: string
) {
  const voiceSession = await prisma.voiceSession.findUnique({
    where: { sessionId },
  });

  if (!voiceSession) throw new Error("Voice session not found");

  const provider = createSynthesisProvider(
    voiceSession.voiceProvider || "BROWSER_NATIVE",
    process.env.OPENAI_API_KEY || process.env.ELEVENLABS_API_KEY,
    process.env.AZURE_TTS_REGION
  ) as SynthesisProvider;

  const result = await provider.synthesize(text, {
    voice: voiceId || voiceSession.voiceId || undefined,
  });

  // Store synthesized audio
  // In a real implementation, you would upload to storage
  // For now, we'll just return the buffer info

  return {
    audioBuffer: result.audioBuffer,
    format: result.format,
    durationMs: result.durationMs,
  };
}

export async function getVoiceSessionCaptures(sessionId: string) {
  const voiceSession = await prisma.voiceSession.findUnique({
    where: { sessionId },
    include: {
      captures: {
        include: {
          transcript: {
            include: { segments: true },
          },
          analysis: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  return voiceSession?.captures || [];
}

export async function deleteVoiceSessionData(sessionId: string) {
  const voiceSession = await prisma.voiceSession.findUnique({
    where: { sessionId },
    include: { captures: true },
  });

  if (!voiceSession) return;

  // Delete captures, transcripts, analyses, processing jobs
  for (const capture of voiceSession.captures) {
    if (capture.storageKey) {
      // Delete from storage (implementation depends on storage adapter)
    }
  }

  await prisma.voiceSession.delete({
    where: { id: voiceSession.id },
  });
}

export async function getVoiceUsageStats(userId: string) {
  const records = await prisma.voiceUsageRecord.findMany({
    where: { userId },
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