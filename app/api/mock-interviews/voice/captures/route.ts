import { NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { createVoiceCapture, completeVoiceCapture } from "@/lib/voice/voice-interview-orchestrator";
import { Prisma } from "@prisma/client";

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
  const { session, record } = await getCurrent();
  if (!session || !record) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File | null;
    const sessionId = formData.get("sessionId") as string | null;
    const questionId = formData.get("questionId") as string | null;

    if (!file) return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    if (!sessionId) return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    if (!questionId) return NextResponse.json({ error: "Question ID required" }, { status: 400 });

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB` }, { status: 400 });
    }

    const mimeType = file.type || "audio/webm";
    if (!ALLOWED_MIME_TYPES.some(t => mimeType.startsWith(t))) {
      return NextResponse.json({ error: `Unsupported audio format: ${mimeType}` }, { status: 400 });
    }

    // Verify session ownership
    const mockSession = await db.mockInterviewSession.findFirst({
      where: { id: sessionId, userId: session.id },
      include: { voiceSession: true },
    });

    if (!mockSession) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (!mockSession.voiceSession) {
      return NextResponse.json({ error: "Voice session not enabled for this interview" }, { status: 400 });
    }

    // Verify question belongs to session
    const question = await db.mockInterviewQuestion.findFirst({
      where: { id: questionId, sessionId: mockSession.id },
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found in this session" }, { status: 404 });
    }

    // Create capture record
    const capture = await db.voiceCapture.create({
      data: {
        voiceSessionId: mockSession.voiceSession.id,
        questionId,
        captureStatus: "RECORDING",
        mimeType: file.type || "audio/webm",
      },
    });

    // In a real implementation, you would upload the file to storage (S3, GCS, etc.)
    // For now, we'll just return the capture ID and let the client handle the upload
    // In production, you'd use a presigned URL for direct upload to S3/GCS

    return NextResponse.json({
      capture: {
        id: capture.id,
        voiceSessionId: mockSession.voiceSession.id,
        questionId,
        status: "RECORDING",
        mimeType: file.type || "audio/webm",
        createdAt: capture.createdAt,
      },
      // In production, you'd return a presigned upload URL:
      // uploadUrl: await getPresignedUploadUrl(capture.id, file.type, file.size),
    }, { status: 201 });
  } catch (error) {
    console.error("Capture creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { session: authSession, record } = await getCurrent();
  if (!authSession || !record) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const questionId = searchParams.get("questionId");

  if (!sessionId) return NextResponse.json({ error: "Session ID required" }, { status: 400 });

  const mockSession = await db.mockInterviewSession.findFirst({
    where: { id: sessionId, userId: authSession.id },
    include: { voiceSession: true },
  });

  if (!mockSession) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (!mockSession.voiceSession) {
    return NextResponse.json({ error: "Voice session not enabled" }, { status: 400 });
  }

  const where: Prisma.VoiceCaptureWhereInput = {
    voiceSessionId: mockSession.voiceSession.id,
    ...(questionId ? { questionId } : {}),
  };

  const captures = await db.voiceCapture.findMany({
    where,
    include: {
      transcript: {
        include: { segments: { orderBy: { index: "asc" } } },
      },
      analysis: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ captures });
}