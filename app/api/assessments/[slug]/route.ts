import { NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { db as prisma } from "@/lib/db/client";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const assessment = await prisma.assessment.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      sections: {
        orderBy: { position: "asc" },
        select: { id: true, title: true, position: true, questionCount: true },
      },
      questions: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          position: true,
          marks: true,
          isRequired: true,
          question: {
            select: {
              id: true,
              type: true,
              difficulty: true,
              text: true,
              estimatedMinutes: true,
              options: { select: { id: true, text: true, correct: false } },
            },
          },
        },
      },
    },
  });

  if (!assessment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ assessment });
}