import "server-only";
import {
  createClient,
  openai,
  anthropic,
  google,
  withRetry,
  withTimeout,
  generateObject,
  createPiiInputGuardrail,
  createPromptInjectionGuardrail,
  createBudgetGuardrail,
  GuardrailBlockedError,
  GenerateObjectError,
  TimeoutError,
  type Provider,
} from "samai-sdk";
import type { z } from "zod";
import { aiStatus, readAiConfig, type AiConfig } from "./config";
import { AiServiceError } from "./errors";
import { PROMPT_VERSION, SCOPE_PREAMBLE } from "./prompts-base";

/**
 * The only module that talks to samai-sdk. Every AI feature goes through here, server side.
 * Phase 1 only initializes and checks configuration. No model call is made anywhere in the app yet.
 * Verified against samai-sdk 0.3.7 exports: createClient, openai/anthropic/google, withRetry, withTimeout,
 * generateObject, createPiiInputGuardrail, createPromptInjectionGuardrail, createBudgetGuardrail.
 */
export { aiStatus as getAiStatus } from "./config";
export { generateObject } from "samai-sdk";

export type AiClient = ReturnType<typeof createClient>;

function buildProvider(cfg: AiConfig): Provider {
  const apiKey = cfg.apiKey;
  switch (cfg.provider) {
    case "openai":
      return openai({ apiKey });
    case "anthropic":
      return anthropic({ apiKey });
    case "google":
      return google({ apiKey });
    default:
      throw new AiServiceError("NOT_CONFIGURED", "No AI provider selected");
  }
}

/** Wraps a provider with the platform guardrails. Exported so tests can inject a fake provider. */
export function buildClient(provider: Provider, opts: { timeoutMs: number; maxRetries: number; budgetUsd?: number }): AiClient {
  // Timeout innermost so every retry gets a fresh window (per the SDK README).
  const resilient = withRetry(withTimeout(provider, { timeoutMs: opts.timeoutMs }), { maxRetries: opts.maxRetries });
  const budget = opts.budgetUsd ? createBudgetGuardrail({ maxCostUsd: opts.budgetUsd }) : null;
  return createClient({
    provider: resilient,
    inputGuardrails: [
      createPiiInputGuardrail({ mode: "redact" }),
      createPromptInjectionGuardrail({ mode: "block" }),
      ...(budget ? [budget.inputGuardrail] : []),
    ],
    outputGuardrails: budget ? [budget.outputGuardrail] : [],
  });
}

let cached: { key: string; client: AiClient } | null = null;

export function getAiClient(): AiClient {
  const { config, issues } = readAiConfig();
  const status = aiStatus();
  if (issues.length || !status.configured) throw new AiServiceError("NOT_CONFIGURED", "AI is not configured", status.issues);
  const key = JSON.stringify([config.provider, config.model, config.timeoutMs, config.maxRetries, config.budgetUsd, config.apiKey?.length]);
  if (cached?.key !== key) cached = { key, client: buildClient(buildProvider(config), config) };
  return cached.client;
}

function translate(err: unknown): AiServiceError {
  if (err instanceof AiServiceError) return err;
  if (err instanceof GuardrailBlockedError) return new AiServiceError("BLOCKED", `Blocked at ${err.stage} guardrail`);
  if (err instanceof TimeoutError) return new AiServiceError("TIMEOUT", "Provider call timed out");
  if (err instanceof GenerateObjectError) return new AiServiceError("INVALID_OUTPUT", "Output failed schema validation");
  // Provider errors can echo request details, so the original message is deliberately not forwarded.
  return new AiServiceError("PROVIDER_ERROR", "Provider call failed");
}

export interface AiInput {
  system?: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

const withScope = (system?: string) => (system ? `${SCOPE_PREAMBLE}\n\n${system}` : SCOPE_PREAMBLE);

/** Structured output validated with Zod. Malformed output is retried with a repair prompt, then rejected. */
export async function generateStructuredWith<T>(client: AiClient, model: string, schema: z.ZodType<T>, input: AiInput) {
  try {
    const r = await generateObject(client, {
      model: input.model ?? model,
      schema,
      system: withScope(input.system),
      maxTokens: input.maxTokens,
      temperature: input.temperature,
      messages: [{ role: "user", content: input.prompt }],
    });
    return { object: r.object, usage: r.usage, attempts: r.attempts, promptVersion: PROMPT_VERSION };
  } catch (e) {
    throw translate(e);
  }
}

export async function generateStructured<T>(schema: z.ZodType<T>, input: AiInput) {
  const client = getAiClient();
  return generateStructuredWith(client, readAiConfig().config.model!, schema, input);
}

export async function generateTextWith(client: AiClient, model: string, input: AiInput) {
  try {
    const r = await client.generate({
      model: input.model ?? model,
      system: withScope(input.system),
      maxTokens: input.maxTokens,
      temperature: input.temperature,
      messages: [{ role: "user", content: input.prompt }],
    });
    return { text: r.text, usage: r.usage, promptVersion: PROMPT_VERSION };
  } catch (e) {
    throw translate(e);
  }
}

export async function generateText(input: AiInput) {
  const client = getAiClient();
  return generateTextWith(client, readAiConfig().config.model!, input);
}
