import { NextRequest, NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { applicationId } = await params;

  const application = await db.jobApplication.findFirst({
    where: { id: applicationId, userId: session.id },
    select: { id: true },
  });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const history = await db.applicationStatusHistory.findMany({
    where: { applicationId },
    orderBy: { changedAt: "desc" },
  });

  return NextResponse.json({ history });
}