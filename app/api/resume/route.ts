import { NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { z } from "zod";

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
  status: z.string().optional(),
});

export async function GET(req: Request) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const parsed = listQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const { page, pageSize, status } = parsed.data;
  const where: Record<string, any> = { userId: session.id };
  if (status) where.status = status;

  const [resumes, total] = await Promise.all([
    db.resume.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        status: true,
        extractedAt: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { versions: true, processingJobs: true } },
        versions: {
          take: 1,
          orderBy: { versionNumber: "desc" },
          select: { id: true, versionNumber: true, isActive: true, targetRole: true },
        },
      },
    }),
    db.resume.count({ where }),
  ]);

  return NextResponse.json({
    resumes,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

const uploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.enum(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]),
  fileSize: z.number().int().positive().max(10 * 1024 * 1024),
});

export async function POST(req: Request) {
  const { session, record } = await getCurrent();
  if (!session || !record) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = uploadSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const { fileName, mimeType, fileSize } = parsed.data;
  const storageKey = `resumes/${session.id}/${Date.now()}-${Math.random().toString(36).slice(2)}-${fileName}`;

  const resume = await db.resume.create({
    data: {
      userId: session.id,
      fileName,
      fileSize,
      mimeType,
      storageKey,
      status: "UPLOADED",
    },
    select: { id: true, fileName: true, status: true, storageKey: true, createdAt: true },
  });

  return NextResponse.json({ resume, uploadUrl: `/api/resume/upload/${resume.id}` }, { status: 201 });
}