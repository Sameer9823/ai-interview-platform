import { createRequire } from "node:module";
import path from "node:path";

export const PROVIDERS = ["openai", "anthropic", "google"] as const;
export type AiProviderName = (typeof PROVIDERS)[number];

/** Verified against samai-sdk 0.3.7: provider constructors take { apiKey }, and each needs its own peer SDK. */
const KEY_VAR: Record<AiProviderName, string> = { openai: "OPENAI_API_KEY", anthropic: "ANTHROPIC_API_KEY", google: "GOOGLE_API_KEY" };
const PEER_SDK: Record<AiProviderName, string> = { openai: "openai", anthropic: "@anthropic-ai/sdk", google: "@google/generative-ai" };

export interface AiConfig {
  provider?: AiProviderName;
  model?: string;
  apiKey?: string;
  timeoutMs: number;
  maxRetries: number;
  budgetUsd?: number;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const num = (v: string | undefined, fallback: number) => (v && Number.isFinite(Number(v)) ? Number(v) : fallback);
const real = (v: string | undefined) => (v && v.trim() !== "" && !/^replace-me$/i.test(v.trim()) ? v.trim() : undefined);

export function readAiConfig(env: Record<string, string | undefined> = process.env): { config: AiConfig; issues: string[] } {
  const issues: string[] = [];
  const raw = real(env.AI_PROVIDER)?.toLowerCase();
  let provider: AiProviderName | undefined;
  if (!raw) issues.push("AI_PROVIDER is not set");
  else if ((PROVIDERS as readonly string[]).includes(raw)) provider = raw as AiProviderName;
  else issues.push(`AI_PROVIDER must be one of: ${PROVIDERS.join(", ")}`);

  const model = real(env.AI_MODEL);
  if (!model) issues.push("AI_MODEL is not set");

  const apiKey = provider ? real(env[KEY_VAR[provider]]) : undefined;
  if (provider && !apiKey) issues.push(`${KEY_VAR[provider]} is not set`);

  const budget = num(env.AI_BUDGET_USD, 0);
  return {
    config: {
      provider,
      model,
      apiKey,
      timeoutMs: clamp(num(env.AI_TIMEOUT_MS, 30_000), 1_000, 120_000),
      maxRetries: clamp(Math.round(num(env.AI_MAX_RETRIES, 2)), 0, 5),
      budgetUsd: budget > 0 ? budget : undefined,
    },
    issues,
  };
}

export function peerSdkInstalled(provider: AiProviderName, resolve?: (name: string) => string): boolean {
  const name = PEER_SDK[provider];
  try {
    (resolve ?? createRequire(path.join(process.cwd(), "package.json")).resolve)(name);
    return true;
  } catch {
    return false;
  }
}

export interface AiStatus {
  configured: boolean;
  provider: AiProviderName | null;
  model: string | null;
  keyPresent: boolean;
  peerSdkInstalled: boolean | null;
  timeoutMs: number;
  maxRetries: number;
  budgetUsd: number | null;
  issues: string[];
}

/** Safe to return from an API: booleans and non secret settings only. Never the key. */
export function aiStatus(env: Record<string, string | undefined> = process.env, resolve?: (name: string) => string): AiStatus {
  const { config, issues } = readAiConfig(env);
  const installed = config.provider ? peerSdkInstalled(config.provider, resolve) : null;
  const all = [...issues];
  if (config.provider && installed === false) all.push(`Peer SDK "${PEER_SDK[config.provider]}" is not installed`);
  return {
    configured: all.length === 0,
    provider: config.provider ?? null,
    model: config.model ?? null,
    keyPresent: !!config.apiKey,
    peerSdkInstalled: installed,
    timeoutMs: config.timeoutMs,
    maxRetries: config.maxRetries,
    budgetUsd: config.budgetUsd ?? null,
    issues: all,
  };
}
