import { NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { z } from "zod";
import { extractText, cleanExtractedText, extractSections, detectContactInfo } from "@/lib/resume/extraction";
import { parseResumeWithAI, mergeExtractedData } from "@/lib/resume/parsing";
import { analyzeResume } from "@/lib/resume/services/analyzer";
import { DEFAULT_RUBRIC } from "@/lib/resume/schemas";
import { detectSkillGaps } from "@/lib/resume/services/skill-gap";
import { generateRecommendations } from "@/lib/resume/services/recommendations";

const analyzeSchema = z.object({
  versionId: z.string().optional(),
  targetRole: z.string().optional(),
  forceReanalyze: z.boolean().default(false),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, record } = await getCurrent();
  if (!session || !record) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = analyzeSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { versionId, targetRole, forceReanalyze } = parsed.data;

  const resume = await db.resume.findFirst({
    where: { id, userId: session.id },
    include: {
      versions: {
        where: versionId ? { id: versionId } : {},
        orderBy: { versionNumber: "desc" },
        take: 1,
        include: { extractedProfile: true, analyses: true },
      },
    },
  });

  if (!resume) return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  if (resume.versions.length === 0) return NextResponse.json({ error: "No version found" }, { status: 404 });

  const version = resume.versions[0];
  if (!version) return NextResponse.json({ error: "Version not found" }, { status: 404 });

  // Check if already analyzed
  const existingAnalysis = version.analyses.find((a) => a.status === "COMPLETED");
  if (existingAnalysis && !forceReanalyze) {
    return NextResponse.json({ analysis: existingAnalysis, message: "Analysis already exists" });
  }

  // Update status
  await db.resumeVersion.update({
    where: { id: version.id },
    data: { status: "ANALYZING" } as any,
  });

  await db.resumeProcessingJob.create({
    data: {
      resumeId: resume.id,
      resumeVersionId: version.id,
      type: "ANALYSIS",
      status: "IN_PROGRESS",
      inputJson: { targetRole },
    },
  });

  try {
    // Get extracted text
    let extractedText = version.extractedText;
    if (!extractedText && resume.storageKey) {
      // Extract from storage
      // For now, assume extractedText is available
      extractedText = version.extractedText || "";
    }

    if (!extractedText) {
      throw new Error("No extracted text available. Run extraction first.");
    }

    const cleanedText = cleanExtractedText(extractedText);
    const sections = extractSections(cleanedText);
    const contactInfo = detectContactInfo(cleanedText);

    // Parse with AI if not already parsed
    let profile = version.extractedProfile?.profileJson as any;
    if (!profile) {
      profile = await parseResumeWithAI(cleanedText);
      profile = mergeExtractedData(profile, { contact: contactInfo, sections });
    }

    // Analyze
    const analysis = await analyzeResume(profile, cleanedText, targetRole, DEFAULT_RUBRIC);

    // Detect skill gaps
    const skillGaps = await detectSkillGaps(version.id, profile, targetRole, session.id);

    // Generate recommendations
    const recommendations = generateRecommendations({
      profile,
      analysis: {
        categories: analysis.categories.map(c => ({ category: c.category, score: c.score, maxScore: c.maxScore })),
        issues: analysis.issues,
      },
      skillGaps,
      targetRole,
    });

    // Save analysis
    const savedAnalysis = await db.resumeAnalysis.create({
      data: {
        resumeVersionId: version.id,
        targetRole,
        status: "COMPLETED",
        analysisJson: analysis,
        rubricVersion: DEFAULT_RUBRIC.version,
        overallScore: analysis.overallScore,
        completedAt: new Date(),
        categories: {
          create: analysis.categories.map(c => ({
            category: c.category,
            score: c.score,
            maxScore: c.maxScore,
            weight: c.weight,
            findings: c.findings,
          })),
        },
        recommendations: {
          create: recommendations.map(r => ({
            title: r.title,
            description: r.description,
            priority: r.priority,
            category: r.category,
            evidence: r.evidence,
            expectedEffort: r.expectedEffort,
            relatedSkills: r.relatedSkills,
            suggestedTasks: r.suggestedTasks,
          })),
        },
      },
      include: { categories: true, recommendations: true },
    });

    // Save skill gaps
    await db.skillGap.createMany({
      data: skillGaps.map(g => ({
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

    return NextResponse.json({ analysis: savedAnalysis, skillGaps, recommendations });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Analysis failed";
    await db.resumeVersion.update({
      where: { id: version.id },
      data: { status: "READY_FOR_ANALYSIS" } as any,
    });
    await db.resumeProcessingJob.updateMany({
      where: { resumeVersionId: version.id, type: "ANALYSIS", status: "IN_PROGRESS" },
      data: { status: "FAILED", errorMessage, completedAt: new Date() },
    });
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}