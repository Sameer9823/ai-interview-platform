import { NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { createTranscriptionProvider } from "@/lib/voice/transcription-service";
import type { TranscriptionProvider } from "@/lib/voice/voice-provider";
import { completeVoiceCapture, failVoiceCapture } from "@/lib/voice/voice-interview-orchestrator";
import { recordVoiceUsage } from "@/lib/voice/consent-service";
import { AiServiceError } from "@/lib/ai/errors";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_MIME_TYPES = [
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/ogg",
  "audio/ogg;codecs=opus",
  "audio/wav",
  "audio/mp3",
  "audio/mp4",
  "audio/m4a",
  "audio/flac",
];

export async function POST(req: Request) {
  const { session: authSession, record } = await getCurrent();
  if (!authSession || !record) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File | null;
    const captureId = formData.get("captureId") as string | null;
    const questionId = formData.get("questionId") as string | null;
    const sessionId = formData.get("sessionId") as string | null;
    const language = formData.get("language") as string || "en-US";

    if (!file) return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    if (!captureId) return NextResponse.json({ error: "Capture ID required" }, { status: 400 });
    if (!questionId) return NextResponse.json({ error: "Question ID required" }, { status: 400 });
    if (!sessionId) return NextResponse.json({ error: "Session ID required" }, { status: 400 });

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB` }, { status: 400 });
    }

    const mimeType = file.type || "audio/webm";
    if (!ALLOWED_MIME_TYPES.some(t => mimeType.startsWith(t))) {
      return NextResponse.json({ error: `Unsupported audio format: ${mimeType}` }, { status: 400 });
    }

    // Verify ownership
    const capture = await db.voiceCapture.findUnique({
      where: { id: captureId },
      include: { voiceSession: true },
    });

    if (!capture) return NextResponse.json({ error: "Capture not found" }, { status: 404 });
    if (capture.voiceSession.sessionId !== sessionId) {
      return NextResponse.json({ error: "Capture does not belong to this session" }, { status: 403 });
    }

    // Update capture status
    await db.voiceCapture.update({
      where: { id: captureId },
      data: { captureStatus: "PROCESSING" },
    });

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    // Get voice session for provider config
    const voiceSession = await db.voiceSession.findUnique({
      where: { id: capture.voiceSessionId },
    });

    if (!voiceSession) {
      return NextResponse.json({ error: "Voice session not found" }, { status: 404 });
    }

    try {
      // Get transcription provider
      const provider = createTranscriptionProvider(
        voiceSession.transcriptionProvider || "BROWSER_NATIVE",
        process.env.OPENAI_API_KEY || process.env.DEEPGRAM_API_KEY || process.env.ASSEMBLYAI_API_KEY
      ) as TranscriptionProvider;

      // Transcribe
      const result = await provider.transcribe(audioBuffer as Buffer, {
        language: voiceSession.language,
      });

      // Save transcript
      const transcript = await db.voiceTranscript.create({
        data: {
          captureId: capture.id,
          fullText: result.text,
          language: result.language || voiceSession.language,
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

      // Update capture
      await completeVoiceCapture(capture.id, {
        audioDuration: audioBuffer.length / 48000, // rough estimate
        mimeType: file.type,
      });

      // Record usage
      await recordVoiceUsage({
        userId: record.id,
        sessionId: capture.voiceSession.sessionId,
        operation: "TRANSCRIBE",
        provider: voiceSession.transcriptionProvider || "BROWSER_NATIVE",
        audioDurationMs: capture.audioDuration ? capture.audioDuration * 1000 : undefined,
        characters: result.text.length,
        estimatedCostUsd: 0.001,
      });

      return NextResponse.json({
        transcript: {
          id: transcript.id,
          text: result.text,
          confidence: result.confidence,
          language: result.language,
          isFinal: result.isFinal,
          segments: result.segments,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Transcription failed";

      // Update capture with error
      await failVoiceCapture(capture.id, errorMessage);

      if (error instanceof Error && error.message.includes("NOT_CONFIGURED")) {
        return NextResponse.json({ error: "Transcription provider not configured" }, { status: 503 });
      }
      throw error;
    }
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}