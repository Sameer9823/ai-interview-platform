import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrent } from "@/lib/auth/session";
import { createMockInterview } from "@/lib/ai/services/mock-interview-orchestrator";
import { mockInterviewConfigSchema } from "@/lib/ai/schemas";

export async function POST(req: Request) {
  const { session, record } = await getCurrent();
  if (!session || !record) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = mockInterviewConfigSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const input = parsed.data;

  try {
    const mockInterview = await createMockInterview({
      userId: record.id,
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

    return NextResponse.json({ mockInterview }, { status: 201 });
  } catch (e) {
    console.error("Mock interview creation error:", e);
    return NextResponse.json({ error: "Failed to create mock interview" }, { status: 500 });
  }
}