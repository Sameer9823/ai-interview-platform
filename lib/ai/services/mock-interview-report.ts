import "server-only";
import { z } from "zod";
import { getAiClient, generateStructured } from "../samai-service";
import { mockInterviewReportSchema, type MockInterviewReport, type MockInterviewPlan } from "../schemas";
import { AiServiceError } from "../errors";
import { checkUsageLimit, recordUsage } from "./usage-manager";

const REPORT_GENERATION_SYSTEM = `You are an expert interview coach creating a comprehensive performance report. Create a detailed, honest, and actionable report based on the actual interview data.`;

const REPORT_GENERATION_PROMPT = `Generate a comprehensive mock interview performance report.

Interview Summary:
- Mode: \${mode}
- Target Role: \${targetRole}
- Difficulty: \${difficulty}
- Duration: \${durationMinutes} minutes planned, \${actualDurationMinutes} actual
- Questions: \${questionsTotal} total, \${questionsAnswered} answered, \${questionsSkipped} skipped
- Follow-ups: \${followUpsUsed}

Question Details:
\${questionsDetail}

Candidate Profile:
- Target Role: \${targetRole}
- Career Level: \${careerLevel}
- Mode: \${mode}
- Interview Style: \${interviewStyle}

Skill Breakdown from Evaluations:
\${skillBreakdown}

Requirements:
1. Calculate overall score from completed evaluations
2. Provide skill breakdown with evidence
3. Write an honest summary of performance
4. Provide 3-5 prioritized, actionable recommendations
5. Note evaluation coverage and limitations
6. Suggest next practice steps and next interview config
7. Be honest about limitations and missing data

Return a comprehensive report matching the schema.`;

export async function generateMockInterviewReport(
  sessionId: string,
  mode: string,
  targetRole: string,
  difficulty: string,
  interviewStyle: string,
  durationMinutes: number,
  actualDurationMinutes: number,
  questionsTotal: number,
  questionsAnswered: number,
  questionsSkipped: number,
  followUpsUsed: number,
  questionsDetail: any[],
  targetRoleFinal: string,
  careerLevel: string | undefined,
  interviewStyleFinal: string,
  skillBreakdown: any
): Promise<any> {
  const questionsDetailText = questionsDetail.map((q, i) => 
    `${i + 1}. [${q.turnType}] ${q.questionText}\nType: ${q.questionType}, Difficulty: ${q.difficulty}\nAnswer: ${q.answerText || "[Skipped]"}\nScore: ${q.evaluation?.overallScore ?? "N/A"}\nStrengths: ${q.evaluation?.strengths?.join(", ") || "N/A"}\nImprovements: ${q.evaluation?.improvements?.join(", ") || "N/A"}`
  ).join("\n\n");

  const skillBreakdownText = Object.entries(skillBreakdown).map(([skill, data]: [string, any]) => 
    `${skill}: ${data.averageScore?.toFixed(1) || "N/A"}% (${data.count} evals) - ${data.evidence?.join("; ") || "No evidence"}`
  ).join("\n");

  const prompt = REPORT_GENERATION_PROMPT
    .replace("${mode}", mode)
    .replace("${targetRole}", targetRole)
    .replace("${difficulty}", difficulty)
    .replace("${durationMinutes}", String(durationMinutes))
    .replace("${actualDurationMinutes}", String(actualDurationMinutes))
    .replace("${questionsTotal}", String(questionsTotal))
    .replace("${questionsAnswered}", String(questionsAnswered))
    .replace("${questionsSkipped}", String(questionsSkipped))
    .replace("${followUpsUsed}", String(followUpsUsed))
    .replace("${questionsDetail}", questionsDetailText)
    .replace("${targetRole}", targetRoleFinal)
    .replace("${careerLevel}", careerLevel || "Not specified")
    .replace("${mode}", mode)
    .replace("${interviewStyle}", interviewStyleFinal)
    .replace("${skillBreakdown}", skillBreakdownText);

  try {
    const result = await generateStructured(mockInterviewReportSchema, {
      system: REPORT_GENERATION_SYSTEM,
      prompt,
      temperature: 0.3,
      maxTokens: 6000,
    });

    await recordUsage({
      operation: "mock_interview_report",
      model: "unknown",
      inputTokens: result.usage?.inputTokens ?? 0,
      outputTokens: result.usage?.outputTokens ?? 0,
    });

    return result.object;
  } catch (e) {
    throw new AiServiceError("PROVIDER_ERROR", "Failed to generate interview report");
  }
}

export function buildDeterministicReport(
  sessionId: string,
  userId: string,
  questionsDetail: any[],
  mode: string,
  targetRole: string
): any {
  const evaluatedQuestions = questionsDetail.filter(q => q.evaluation && q.evaluation.overallScore !== undefined);
  const scores = evaluatedQuestions.map(q => q.evaluation!.overallScore!);
  const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  const skillMap = new Map<string, { scores: number[]; evidence: string[]; count: number }>();
  
  for (const q of evaluatedQuestions) {
    const evalData = q.evaluation;
    if (evalData.dimensionScores) {
      for (const dim of evalData.dimensionScores) {
        const skill = dim.name;
        if (!skillMap.has(skill)) skillMap.set(skill, { scores: [], evidence: [], count: 0 });
        const entry = skillMap.get(skill)!;
        entry.scores.push(dim.score);
        entry.evidence.push(dim.evidence || "");
        entry.count++;
      }
    }
  }

  const skillBreakdown = Array.from(skillMap.entries()).map(([skill, data]) => ({
    skill,
    category: "Technical",
    score: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
    evidence: data.evidence.filter(Boolean).slice(0, 3),
  }));

  const answered = questionsDetail.filter(q => q.answerText && q.answerText.trim().length > 0).length;
  const skipped = questionsDetail.filter(q => !q.answerText || q.answerText.trim().length === 0).length;

  const summary = overallScore !== null
    ? `Completed ${answered}/${questionsDetail.length} questions with an average score of ${overallScore}%. ${skipped > 0 ? `${skipped} question(s) skipped.` : ""}`
    : `Completed ${answered}/${questionsDetail.length} questions. Evaluation pending for some answers.`;

  const recommendations = [];
  if (overallScore !== null && overallScore < 70) {
    recommendations.push({
      title: "Strengthen core fundamentals",
      description: "Focus on areas where scores were below 70%. Review fundamental concepts and practice structured problem-solving.",
      priority: 1,
      category: "Knowledge",
      relatedSkills: skillBreakdown.filter(s => s.score < 70).map(s => s.skill),
    });
  }

  return {
    reportVersion: 1,
    overallScore,
    skillBreakdown,
    summary,
    recommendations: recommendations.slice(0, 5),
    evaluationCoverage: {
      questionsEvaluated: evaluatedQuestions.length,
      questionsTotal: questionsDetail.length,
      dimensionsEvaluated: evaluatedQuestions.reduce((sum, q) => sum + (q.evaluation?.dimensionScores?.length || 0), 0),
    },
    limitations: overallScore === null ? "Some answers could not be evaluated automatically. Manual review recommended." : undefined,
  };
}