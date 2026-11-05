import { NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { detectSkillGaps } from "@/lib/resume/services/skill-gap";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const versionId = searchParams.get("versionId");
  const targetRole = searchParams.get("targetRole") || undefined;

  const resume = await db.resume.findFirst({
    where: { id, userId: session.id },
    include: {
      versions: {
        where: versionId ? { id: versionId } : {},
        orderBy: { versionNumber: "desc" },
        take: 1,
        include: {
          extractedProfile: true,
          skillGaps: true,
        },
      },
    },
  });

  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (resume.versions.length === 0) return NextResponse.json({ error: "No version found" }, { status: 404 });

  const version = resume.versions[0];
  if (!version) return NextResponse.json({ error: "Version not found" }, { status: 404 });
  if (!version.extractedProfile) {
    return NextResponse.json({ error: "Resume version not yet parsed" }, { status: 400 });
  }

  // Return existing gaps if available
  if (version.skillGaps.length > 0) {
    return NextResponse.json({ skillGaps: version.skillGaps });
  }

  // Otherwise compute
  const profile = version.extractedProfile.profileJson as any;
  const gaps = await detectSkillGaps(version.id, profile, targetRole, session.id);

  await db.skillGap.createMany({
    data: gaps.map(g => ({
      resumeVersionId: version.id,
      skill: g.skill,
      category: g.category,
      targetRole: g.targetRole,
      resumeEvidence: g.resumeEvidence,
      assessmentEvidence: g.assessmentEvidence,
      practiceEvidence: g.practiceEvidence,
      classification: g.classification,
      confidence: g.confidence,
      suggestedAction: g.suggestedAction,
    })),
  });

  return NextResponse.json({ skillGaps: gaps });
}