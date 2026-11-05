import "server-only";
import { z } from "zod";
import { getAiClient, generateStructured } from "../samai-service";
import { mockInterviewQuestionSchema, type MockInterviewPlan } from "../schemas";
import { AiServiceError } from "../errors";
import { checkUsageLimit, recordUsage } from "./usage-manager";

const QUESTION_GENERATION_SYSTEM = `You are an expert interviewer creating realistic, high-quality interview questions. Generate questions that are:
- Relevant to the role, mode, and candidate level
- Clear, unambiguous, and professionally phrased
- Appropriate for the specified difficulty and question type
- Designed to assess specific competencies
- Include evaluation criteria for consistent grading`;

const QUESTION_GENERATION_PROMPT = `Generate the next interview question based on the interview plan and conversation history.

Interview Plan:
\${plan}

Conversation History:
\${history}

Current Topic: \${currentTopic}
Questions Asked: \${questionsAsked}/\${totalQuestions}
Follow-ups Used: \${followUpsUsed}/\${maxFollowUps}

Candidate Context:
- Target Role: \${targetRole}
- Mode: \${mode}
- Difficulty: \${difficulty}
- Interview Style: \${interviewStyle}

Requirements:
1. Generate ONE primary question or follow-up appropriate for the current state
2. Match the question type to the topic and mode
3. Include clear evaluation rubric with weighted criteria
3. For coding: specify language, constraints, input/output format, examples
4. For system design: specify scope, requirements, constraints
5. For behavioral: reference STAR framework
5. For technical: specify expected concepts and depth
6. For system design: specify scope (high-level vs detailed)
7. Questions should be challenging but fair for the difficulty level
7. Avoid repeating concepts already covered
8. Follow the interview plan's topic sequence

Return a single question with full metadata including evaluation rubric.`;

export async function generateMockInterviewQuestion(
  plan: any,
  history: any[],
  currentTopic: string,
  questionsAsked: number,
  totalQuestions: number,
  followUpsUsed: number,
  maxFollowUps: number,
  targetRole: string,
  mode: string,
  difficulty: string,
  interviewStyle: string,
  targetLanguage?: string
) {
  const historyText = history.map((h, i) => 
    `${i + 1}. [${h.turnType}] ${h.questionText}\nAnswer: ${h.answerText || "[No answer yet]"}`
  ).join("\n\n");

  const prompt = QUESTION_GENERATION_PROMPT
    .replace("${plan}", JSON.stringify(plan, null, 2))
    .replace("${history}", historyText || "No previous questions")
    .replace("${currentTopic}", currentTopic)
    .replace("${questionsAsked}", String(questionsAsked))
    .replace("${totalQuestions}", String(totalQuestions))
    .replace("${followUpsUsed}", String(followUpsUsed))
    .replace("${maxFollowUps}", String(maxFollowUps))
    .replace("${targetRole}", targetRole)
    .replace("${mode}", "Interview mode from plan")
    .replace("${difficulty}", "From plan")
    .replace("${interviewStyle}", "From plan")
    .replace("${targetLanguage}", targetLanguage || "Not specified");

  try {
    const result = await generateStructured(mockInterviewQuestionSchema, {
      system: QUESTION_GENERATION_SYSTEM,
      prompt,
      temperature: 0.4,
      maxTokens: 4000,
    });

    await recordUsage({
      operation: "mock_interview_question",
      model: "unknown",
      inputTokens: result.usage?.inputTokens ?? 0,
      outputTokens: result.usage?.outputTokens ?? 0,
    });

    return result.object;
  } catch (e) {
    throw new AiServiceError("PROVIDER_ERROR", "Failed to generate interview question");
  }
}

export async function generateFollowUpQuestion(
  originalQuestion: string,
  candidateAnswer: string,
  questionType: string,
  topic: string,
  difficulty: string,
  mode: string,
  targetRole: string,
  evaluationResult: any,
  maxFollowUps: number,
  followUpsUsed: number
) {
  const FOLLOW_UP_PROMPT = `Generate a contextual follow-up question based on the candidate's answer.

Original Question: ${originalQuestion}
Candidate's Answer: ${candidateAnswer}
Question Type: ${questionType}
Topic: ${topic}
Difficulty: ${difficulty}
Mode: ${mode}
Target Role: ${targetRole}

Previous Evaluation:
- Score: ${evaluationResult.overallScore ?? "N/A"}
- Strengths: ${evaluationResult.strengths?.join(", ") || "None"}
- Improvements: ${evaluationResult.improvements?.join(", ") || "None"}
- Missing Concepts: ${evaluationResult.missingConcepts?.join(", ") || "None"}

Follow-ups Used: ${followUpsUsed}/${maxFollowUps}

Generate a concise, targeted follow-up that:
1. Probes deeper into areas where the answer was weak or incomplete
2. Asks for clarification on vague points
3. Requests specific examples or evidence
4. Explores trade-offs or alternative approaches
4. Tests depth of understanding
5. Is natural and conversational

Return a single follow-up question with appropriate type (FOLLOW_UP/CLARIFICATION) and evaluation rubric.`;

  try {
    const result = await generateStructured(mockInterviewQuestionSchema, {
      system: QUESTION_GENERATION_SYSTEM,
      prompt: FOLLOW_UP_PROMPT,
      temperature: 0.5,
      maxTokens: 3000,
    });

    await recordUsage({
      operation: "mock_interview_followup",
      model: "unknown",
      inputTokens: result.usage?.inputTokens ?? 0,
      outputTokens: result.usage?.outputTokens ?? 0,
    });

    return result.object;
  } catch (e) {
    throw new AiServiceError("PROVIDER_ERROR", "Failed to generate follow-up question");
  }
}

export async function generateHint(
  questionText: string,
  questionType: string,
  candidateAnswer: string,
  topic: string,
  difficulty: string
) {
  const HINT_SYSTEM = `You are a helpful interviewer providing a subtle hint to guide the candidate without giving away the answer.`;

  const HINT_PROMPT = `Provide a subtle hint for this interview question.

Question: ${questionText}
Question Type: ${questionType}
Candidate's Current Answer: ${candidateAnswer || "[No answer yet]"}
Topic: ${topic}
Difficulty: ${difficulty}

Provide ONE subtle hint that:
1. Guides without giving the answer
2. Points to the right concept or approach
3. Is encouraging and professional
4. Is appropriate for the difficulty level

Return only the hint text.`;

  try {
    const result = await generateStructured(
      z.object({ hint: z.string() }),
      {
        system: HINT_SYSTEM,
        prompt: HINT_PROMPT,
        temperature: 0.3,
        maxTokens: 500,
      }
    );

    await recordUsage({
      operation: "mock_interview_hint",
      model: "unknown",
      inputTokens: result.usage?.inputTokens ?? 0,
      outputTokens: result.usage?.outputTokens ?? 0,
    });

    return result.object.hint;
  } catch (e) {
    throw new AiServiceError("PROVIDER_ERROR", "Failed to generate hint");
  }
}