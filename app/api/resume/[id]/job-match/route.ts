import { NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { z } from "zod";
import { parseJobDescription, matchResumeToJob, buildSkillGapAnalysis } from "@/lib/resume/services/job-matcher";

const jobMatchSchema = z.object({
  versionId: z.string().optional(),
  jobDescription: z.string().min(50).max(20000),
  targetRole: z.string().optional(),
  jdTitle: z.string().optional(),
  jdCompany: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, record } = await getCurrent();
  if (!session || !record) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = jobMatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const { versionId, jobDescription, targetRole, jdTitle, jdCompany } = parsed.data;

  const resume = await db.resume.findFirst({
    where: { id, userId: session.id },
    include: {
      versions: {
        where: versionId ? { id: versionId } : {},
        orderBy: { versionNumber: "desc" },
        take: 1,
        include: { extractedProfile: true },
      },
    },
  });

  if (!resume) return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  if (resume.versions.length === 0) return NextResponse.json({ error: "No version found" }, { status: 404 });

  const version = resume.versions[0];
  if (!version) return NextResponse.json({ error: "Version not found" }, { status: 404 });
  if (!version.extractedProfile) {
    return NextResponse.json({ error: "Resume version not yet parsed. Run analysis first." }, { status: 400 });
  }

  const profile = version.extractedProfile.profileJson as any;

  // Parse job description
  const jdParsed = await parseJobDescription(jobDescription);

  // Save job description
  const savedJD = await db.jobDescription.create({
    data: {
      userId: session.id,
      source: "PASTED",
      rawText: jobDescription,
      title: jdTitle || jdParsed.title,
      company: jdCompany || jdParsed.company,
      parsedJson: jdParsed,
    },
  });

  // Match
  const match = await matchResumeToJob(profile, jdParsed, targetRole);

  // Build skill gaps from match
  const matchGaps = buildSkillGapAnalysis(profile, jdParsed, match);

  // Save job match
  const jobMatch = await db.jobMatch.create({
    data: {
      resumeVersionId: version.id,
      jobDescriptionId: savedJD.id,
      matchJson: match,
      overallMatch: match.overallMatch,
    },
  });

  return NextResponse.json({ jobMatch, jdParsed, matchGaps });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const versionId = searchParams.get("versionId");

  const resume = await db.resume.findFirst({
    where: { id, userId: session.id },
    include: {
      versions: {
        where: versionId ? { id: versionId } : {},
        orderBy: { versionNumber: "desc" },
        take: 1,
        include: {
          jobMatches: {
            include: { jobDescription: true },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      },
    },
  });

  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ resume, jobMatches: resume.versions[0]?.jobMatches || [] });
}