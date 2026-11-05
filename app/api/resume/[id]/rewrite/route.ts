import { NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { z } from "zod";
import { rewriteSection, rewriteBullet, validateRewrite } from "@/lib/resume/services/rewriter";

const rewriteSchema = z.object({
  versionId: z.string().optional(),
  section: z.string().min(1),
  originalText: z.string().min(10).max(10000),
  targetRole: z.string().optional(),
  bulletContext: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, record } = await getCurrent();
  if (!session || !record) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = rewriteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const { versionId, section, originalText, targetRole, bulletContext } = parsed.data;

  const resume = await db.resume.findFirst({
    where: { id, userId: session.id },
    include: {
      versions: {
        where: versionId ? { id: versionId } : {},
        orderBy: { versionNumber: "desc" },
        take: 1,
        include: { extractedProfile: true, analyses: { take: 1 } },
      },
    },
  });

  if (!resume) return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  if (resume.versions.length === 0) return NextResponse.json({ error: "No version found" }, { status: 404 });

  const version = resume.versions[0];
  if (!version) return NextResponse.json({ error: "Version not found" }, { status: 404 });
  if (!version.extractedProfile) {
    return NextResponse.json({ error: "Resume version not yet parsed" }, { status: 400 });
  }

  const profile = version.extractedProfile.profileJson as any;

  let rewrite;
  if (bulletContext) {
    rewrite = await rewriteBullet(originalText, bulletContext, targetRole);
  } else {
    rewrite = await rewriteSection(section, originalText, profile, targetRole);
  }

  const validation = validateRewrite(originalText, rewrite.suggestedText);

  const saved = await db.resumeRewriteSuggestion.create({
    data: {
      analysisId: version.analyses[0]?.id || "",
      section,
      originalText,
      suggestedText: rewrite.suggestedText,
      rationale: rewrite.rationale,
      assumptions: rewrite.assumptions,
      isAccepted: false,
    },
  });

  return NextResponse.json({ rewrite: saved, validation });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const analysisId = searchParams.get("analysisId");

  const resume = await db.resume.findFirst({
    where: { id, userId: session.id },
    include: {
      versions: {
        include: {
          analyses: {
            where: analysisId ? { id: analysisId } : {},
            include: { rewrites: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rewrites = resume.versions.flatMap(v => v.analyses.flatMap(a => a.rewrites));
  return NextResponse.json({ rewrites });
}