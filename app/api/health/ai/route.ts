import { NextResponse } from "next/server";
import { getAiStatus } from "@/lib/ai/samai-service";
import { getCurrent } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** Safe configuration check. Signed in users only. Reports booleans and non secret settings, never keys. */
export async function GET() {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(getAiStatus(), { headers: { "Cache-Control": "no-store" } });
}
