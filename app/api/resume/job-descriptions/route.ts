import { NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { z } from "zod";

const createJDSchema = z.object({
  rawText: z.string().min(50).max(20000),
  url: z.string().url().optional(),
  title: z.string().optional(),
  company: z.string().optional(),
});

export async function POST(req: Request) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createJDSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const { rawText, url, title, company } = parsed.data;

  const jd = await db.jobDescription.create({
    data: {
      userId: session.id,
      source: url ? "URL" : "PASTED",
      rawText,
      url,
      title,
      company,
    },
  });

  return NextResponse.json({ jobDescription: jd }, { status: 201 });
}

export async function GET(req: Request) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20"), 50);

  const [jds, total] = await Promise.all([
    db.jobDescription.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { matches: true } } },
    }),
    db.jobDescription.count({ where: { userId: session.id } }),
  ]);

  return NextResponse.json({
    jobDescriptions: jds,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}