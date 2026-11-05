import { NextRequest, NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { analyzeJobDescription } from "@/lib/opportunities";

export async function POST(req: NextRequest) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { rawText, resumeVersionId, jobDescriptionId } = body;
  if (!rawText || typeof rawText !== "string") {
    return NextResponse.json({ error: "rawText is required" }, { status: 400 });
  }

  try {
    const analysis = await analyzeJobDescription(
      session.id,
      rawText,
      resumeVersionId,
      jobDescriptionId
    );
    return NextResponse.json({ analysis }, { status: 201 });
  } catch (error) {
    console.error("Analyze job description error:", error);
    const msg = error instanceof Error ? error.message : "Failed to analyze job description";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}