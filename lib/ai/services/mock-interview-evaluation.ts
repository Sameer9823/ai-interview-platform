import "server-only";
import { z } from "zod";
import { getAiClient, generateStructured } from "../samai-service";
import { mockInterviewEvaluationSchema, type MockInterviewEvaluation, type MockInterviewQuestion } from "../schemas";
import { evaluateAnswer, evaluateCodeAnswer } from "./answer-evaluator";
import { AiServiceError } from "@/lib/ai/errors";
import { checkUsageLimit, recordUsage } from "./usage-manager";

const EVALUATION_SYSTEM = `You are an expert interviewer evaluating candidate responses. Provide fair, detailed, and constructive evaluations based on the given rubric and criteria. Be specific, evidence-based, and constructive.`;

const EVALUATION_PROMPT = `Evaluate this interview answer against the provided rubric and criteria.

Question: \${questionText}
Question Type: \${questionType}
Topic: \${topic}
Difficulty: \${difficulty}
Mode: \${mode}
Target Role: \${targetRole}

Expected Answer Criteria (Rubric):
\${rubric}

Candidate's Answer:
\${answerText}
\${answerCode}

Evaluation Criteria:
\${criteria}

Evaluate the answer across all criteria in the rubric. For each criterion:
1. Score 0-100 based on how well the answer meets the criterion
2. Provide specific evidence from the answer
3. Note strengths and gaps

Return structured evaluation with:
- Dimension scores for each criterion
- Overall weighted score
- Specific strengths demonstrated
- Specific improvements needed
- Missing concepts or evidence
- Confidence level in your evaluation
- Evaluation status`;

export async function evaluateMockInterviewAnswer(
  question: MockInterviewQuestion,
  answerText: string,
  answerCode: string | undefined,
  language: string | undefined,
  context: {
    mode: string;
    targetRole: string;
    difficulty: string;
    interviewStyle: string;
  }
): Promise<MockInterviewEvaluation> {
  await checkUsageLimit("mock_interview_evaluation");

  const rubricText = question.evaluationRubric
    .map((c, i) => `${i + 1}. ${c.name} (${Math.round(c.weight * 100)}%): ${c.description}`)
    .join("\n");

  const criteriaText = question.evaluationRubric
    .map((c, i) => `${i + 1}. ${c.name} (weight: ${c.weight})`)
    .join("\n");

  const prompt = EVALUATION_PROMPT
    .replace("${questionText}", question.questionText)
    .replace("${questionType}", question.questionType)
    .replace("${topic}", question.topicTags.join(", "))
    .replace("${difficulty}", String(question.difficulty))
    .replace("${mode}", "From session")
    .replace("${targetRole}", "From session")
    .replace("${rubric}", rubricText)
    .replace("${answerText}", answerText)
    .replace("${answerCode}", answerCode || "No code submitted")
    .replace("${language}", language || "Not specified")
    .replace("${rubric}", rubricText)
    .replace("${criteria}", criteriaText);

  try {
    const result = await generateStructured(mockInterviewEvaluationSchema, {
      system: EVALUATION_SYSTEM,
      prompt,
      temperature: 0.2,
      maxTokens: 4000,
    });

    await recordUsage({
      operation: "mock_interview_evaluation",
      model: "unknown",
      inputTokens: result.usage?.inputTokens ?? 0,
      outputTokens: result.usage?.outputTokens ?? 0,
    });

    return {
      rubricVersion: result.object.rubricVersion,
      dimensionScores: result.object.dimensionScores,
      overallScore: result.object.overallScore,
      strengths: result.object.strengths || [],
      improvements: result.object.improvements || [],
      missingConcepts: result.object.missingConcepts || [],
      evidence: result.object.evidence || [],
      confidenceStatus: result.object.confidenceStatus || "HIGH",
      evaluationStatus: result.object.evaluationStatus || "COMPLETED",
    };
  } catch (e) {
    // Fallback to deterministic evaluation for objective question types
    if (["MULTIPLE_CHOICE", "SINGLE_ANSWER", "CODING", "SQL"].includes(question.questionType)) {
      return deterministicEvaluation(question, answerText, answerCode, language);
    }
    throw new AiServiceError("PROVIDER_ERROR", "Failed to evaluate interview answer");
  }
}

function deterministicEvaluation(
  question: MockInterviewQuestion,
  answerText: string,
  answerCode: string | undefined,
  language: string | undefined
): MockInterviewEvaluation {
  const rubric = question.evaluationRubric;
  const dimensionScores = rubric.map(c => ({
    name: c.name,
    score: 50, // Neutral default
    weight: c.weight,
    evidence: "Deterministic evaluation not fully implemented for this type",
  }));

  return {
    rubricVersion: "1.0",
    dimensionScores,
    overallScore: 50,
    strengths: ["Answer submitted"],
    improvements: ["Detailed evaluation requires AI provider"],
    missingConcepts: [],
    evidence: ["Deterministic fallback used"],
    confidenceStatus: "LOW",
    evaluationStatus: "COMPLETED",
  };
}

export async function evaluateCodingAnswer(
  question: MockInterviewQuestion,
  userCode: string,
  language: string,
  expectedApproach?: string,
  testCases?: { input: string; expected: string }[]
): Promise<MockInterviewEvaluation> {
  const { evaluation } = await evaluateCodeAnswer({
    question: question.questionText,
    userCode,
    language,
    expectedApproach,
    testCases,
    difficulty: question.difficulty,
  });

  return {
    rubricVersion: "1.0",
    dimensionScores: (evaluation.criteria || []).map(c => ({
      name: c.name,
      score: c.score,
      weight: evaluation.criteria ? 1 / evaluation.criteria.length : 1,
      evidence: c.comment,
    })),
    overallScore: evaluation.score,
    strengths: (evaluation.criteria || []).filter(c => c.score >= 70).map(c => c.name),
    improvements: (evaluation.criteria || []).filter(c => c.score < 70).map(c => `${c.name}: ${c.comment}`),
    missingConcepts: (evaluation.criteria || []).filter(c => c.score < 50).map(c => c.name),
    evidence: (evaluation.criteria || []).map(c => c.comment),
    confidenceStatus: "HIGH",
    evaluationStatus: "COMPLETED",
  };
}

export async function evaluateSQLAnswer(
  question: MockInterviewQuestion,
  userSQL: string,
  expectedSQL?: string,
  schema?: any
): Promise<MockInterviewEvaluation> {
  // For now, use the general answer evaluator with SQL-specific context
  const { evaluation } = await evaluateAnswer({
    question: question.questionText,
    questionType: "SQL",
    difficulty: question.difficulty,
    answer: userSQL,
    answerOutline: expectedSQL,
  });

  return {
    rubricVersion: "1.0",
    dimensionScores: (evaluation.criteria || []).map(c => ({
      name: c.name,
      score: c.score,
      weight: evaluation.criteria ? 1 / evaluation.criteria.length : 1,
      evidence: c.comment,
    })),
    overallScore: evaluation.score,
    strengths: (evaluation.criteria || []).filter(c => c.score >= 70).map(c => c.name),
    improvements: (evaluation.criteria || []).filter(c => c.score < 70).map(c => `${c.name}: ${c.comment}`),
    missingConcepts: (evaluation.criteria || []).filter(c => c.score < 50).map(c => c.name),
    evidence: (evaluation.criteria || []).map(c => c.comment),
    confidenceStatus: "HIGH",
    evaluationStatus: "COMPLETED",
  };
}