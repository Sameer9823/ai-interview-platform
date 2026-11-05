import { NextRequest, NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { getJobSearchPreferences, upsertJobSearchPreferences } from "@/lib/opportunities";

export async function GET(req: NextRequest) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const preferences = await getJobSearchPreferences(session.id);
  return NextResponse.json({ preferences });
}

export async function POST(req: NextRequest) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  try {
    const preferences = await upsertJobSearchPreferences(session.id, body);
    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Upsert preferences error:", error);
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 400 });
  }
}