import { NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { createSynthesisProvider } from "@/lib/voice/synthesis-service";
import { recordVoiceUsage } from "@/lib/voice/consent-service";
import { AiServiceError } from "@/lib/ai/errors";

export async function POST(req: Request) {
  const { session: authSession, record } = await getCurrent();
  if (!authSession || !record) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { sessionId, text, voiceId, captureId } = await req.json();

    if (!sessionId || !text) {
      return NextResponse.json({ error: "Session ID and text required" }, { status: 400 });
    }

    if (text.length > 10000) {
      return NextResponse.json({ error: "Text too long (max 10000 characters)" }, { status: 400 });
    }

    // Verify session ownership
    const session = await db.mockInterviewSession.findFirst({
      where: { id: sessionId, userId: authSession.id },
      include: { voiceSession: true },
    });

    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (!session.voiceSession) {
      return NextResponse.json({ error: "Voice session not enabled for this interview" }, { status: 400 });
    }

    const voiceSession = session.voiceSession;

    // Get synthesis provider
    const provider = createSynthesisProvider(
      voiceSession.voiceProvider || "BROWSER_NATIVE",
      process.env.OPENAI_API_KEY || process.env.ELEVENLABS_API_KEY,
      process.env.AZURE_TTS_REGION
    );

    // Check text length limit
    if (text.length > provider.getMaxTextLength()) {
      return NextResponse.json({ 
        error: `Text too long. Max length for this provider: ${provider.getMaxTextLength()}` 
      }, { status: 400 });
    }

    try {
      const result = await provider.synthesize(text, {
        voice: voiceId || voiceSession.voiceId,
      });

      // Record usage
      await recordVoiceUsage({
        userId: session.userId,
        sessionId: session.id,
        operation: "SYNTHESIZE",
        provider: voiceSession.voiceProvider || "BROWSER_NATIVE",
        model: voiceId,
        characters: text.length,
        estimatedCostUsd: 0.001,
      });

      // Return audio as base64 or stream
      const base64Audio = result.audioBuffer.toString("base64");

      return NextResponse.json({
        audioData: base64Audio,
        format: result.format,
        durationMs: result.durationMs,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Synthesis failed";
      
      if (error instanceof AiServiceError && error.code === "NOT_CONFIGURED") {
        return NextResponse.json({ 
          error: "Speech synthesis not configured. Please configure a TTS provider or use browser-native synthesis." 
        }, { status: 503 });
      }
      throw error;
    }
  } catch (error) {
    console.error("Synthesis error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}