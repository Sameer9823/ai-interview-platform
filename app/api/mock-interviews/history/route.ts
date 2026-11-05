import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrent } from "@/lib/auth/session";
import { getUserMockInterviewHistory } from "@/lib/ai/services/mock-interview-orchestrator";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
});

export async function GET(req: Request) {
  const { session, record } = await getCurrent();
  if (!session || !record) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const { page, pageSize } = parsed.data;

  try {
    const result = await getUserMockInterviewHistory(record.id, page, pageSize);
    return NextResponse.json(result);
  } catch (e) {
    console.error("Get mock interview history error:", e);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}