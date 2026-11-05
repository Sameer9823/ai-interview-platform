export type AiErrorCode = "NOT_CONFIGURED" | "BLOCKED" | "TIMEOUT" | "INVALID_OUTPUT" | "PROVIDER_ERROR" | "RATE_LIMITED" | "INVALID_INPUT";

/** Safe to show to users. Never carries provider payloads, prompts or keys. */
export class AiServiceError extends Error {
  constructor(
    public readonly code: AiErrorCode,
    message: string,
    public readonly issues: string[] = [],
  ) {
    super(message);
    this.name = "AiServiceError";
  }
}

export const USER_MESSAGES: Record<AiErrorCode, string> = {
  NOT_CONFIGURED: "AI features are not set up yet. You can keep using everything else.",
  BLOCKED: "That request could not be processed. Please rephrase it.",
  TIMEOUT: "The AI service took too long to respond. Please try again.",
  INVALID_OUTPUT: "The AI service returned something we could not use. Please try again.",
  PROVIDER_ERROR: "The AI service is unavailable right now. Please try again later.",
  RATE_LIMITED: "You have reached your AI usage limit. Please try again later.",
  INVALID_INPUT: "The request was invalid. Please check your input.",
};
