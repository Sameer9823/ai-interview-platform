# AI guardrails

Scope: every language model feature, all routed through `lib/ai/samai-service.ts` (samai-sdk 0.3.7). Phase 1 makes no model calls. This document says what is already enforced in code and what is still planned.

## Risks

| Risk | Likelihood | Severity | Who is most exposed |
|---|---|---|---|
| A practice question presented as a real company question | High without a rule | High: users prepare for the wrong thing | Students and freshers |
| Feedback read as a hiring verdict | Medium | High | Everyone, especially after a bad mock interview |
| Personal data sent to a provider | High (resumes, transcripts) | High | Everyone |
| Instructions hidden in a resume or scraped page | Medium | High | Anyone uploading documents |
| Runaway cost or retry storms | Medium | Medium | The operator |
| Provider outage or slow calls | High | Low to medium | Everyone |
| Malformed model output reaching the UI | High | Medium | Everyone |
| Over trust in confident wording | Medium | Medium | Beginners |

## Values, in priority order

1. Do not mislead: no invented sources, no invented company facts.
2. Protect personal data.
3. Be useful and specific within interview preparation.
4. Be honest about uncertainty.

## Guardrails

| Guardrail | Tier | Status | Where |
|---|---|---|---|
| Scope preamble: preparation and career guidance only, feedback is guidance not a hiring decision, never claim a question came from a real interview | Hard rule in every system prompt | Enforced | `lib/ai/prompts-base.ts`, tested |
| Prompt injection phrases in user input | Hard block | Enforced (SDK guardrail, mode block) | `buildClient`, tested |
| Personal data in user input (emails, phone numbers and similar) | Redact before sending | Enforced (SDK guardrail, mode redact) | `buildClient`, tested |
| Untrusted documents wrapped as data | Hard rule | Helper ready, first used in Phase 5 | `wrapUntrusted`, tested |
| Output must match a Zod schema, one repair attempt, then reject | Hard block | Enforced | `generateStructured`, tested |
| Timeout per call (default 30s) and bounded retries (default 2) | Hard limit | Enforced | `buildClient` |
| Spend cap per server process | Hard block | Enforced when `AI_BUDGET_USD` is set | `buildClient` |
| Raw provider errors never shown | Hard rule | Enforced, tested | `translate` |
| No silent provider fallback | Hard rule | Enforced: no fallback chain is built | `buildClient` |
| Works with no key | Hard rule | Enforced: `NOT_CONFIGURED` error, app unaffected | `getAiClient`, tested |
| User consent before first AI use | Hard rule | Planned, before Phase 3 | n/a |
| Per user rate limit and usage records (AIRequestLog) | Hard limit | Planned | n/a |
| Label on every AI result: "AI generated guidance" | Nudge | Planned with the first AI screen | n/a |
| Original generated questions marked AI generated, never "asked at company" | Hard rule | Planned with Phase 3 data model | n/a |

## What the user sees

| Code | Message |
|---|---|
| NOT_CONFIGURED | AI features are not set up yet. You can keep using everything else. |
| BLOCKED | That request could not be processed. Please rephrase it. |
| TIMEOUT | The AI service took too long to respond. Please try again. |
| INVALID_OUTPUT | The AI service returned something we could not use. Please try again. |
| PROVIDER_ERROR | The AI service is unavailable right now. Please try again later. |

Messages live in `lib/ai/errors.ts`. Blocked requests do not say which rule fired, to avoid teaching people to evade it.

## Escalation

No automatic escalation exists. Before launch decide: who reviews flagged content, and how a user reports a bad AI answer. Resume and transcript features need a human reviewable report path.

## User controls

Planned: consent screen, a switch to turn AI features off, delete resume and transcript data, and a retention setting. None exist yet because no AI feature does.

## Edge cases to test when features arrive

- Resume text containing "ignore previous instructions" (should be treated as data).
- A user pasting someone else's personal data.
- A question that asks for a real interview question from a named company without a source (answer must say it cannot confirm).
- Output that is valid JSON but empty or off topic.
