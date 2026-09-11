# bother-me-not — Architecture

A developer notification filter. GitHub sends events; this system decides whether they are worth interrupting you for, and if so, delivers them to Slack with the right urgency.

---

## The core idea

Most notification systems deliver everything. This one filters first. Every incoming signal passes through an **evaluator** that decides:

- Should this be delivered at all?
- If yes — how urgent is it?
- What should the message say?

The evaluator can be AI-powered or rule-based. Both return the same contract. Everything downstream (delivery, storage, auditing) is identical regardless of which evaluator ran.

---

## System overview

```
GitHub Webhook
      │
      ▼
┌─────────────────────┐
│     apps/api        │  Ingest · Verify · Normalize · Deduplicate · Route
└────────┬────────────┘
         │
    ┌────┴────┐
    │  Router │  Decides which evaluator path based on signal type / config
    └────┬────┘
         │
┌────────┴────────────────────────────────┐
│                                         │
▼                                         ▼
ai-engine-processing queue        signal-processing queue
         │                                │
         ▼                                ▼
┌─────────────────┐             ┌──────────────────┐
│  apps/ai-engine │             │   apps/worker    │
│  (Mastra/Claude)│             │  (rule engine)   │
└────────┬────────┘             └────────┬─────────┘
         │                               │
         └──────────────┬────────────────┘
                        │
                 EvaluationResult
          { deliver, urgency, reason, evaluator }
                        │
                        ▼
              ┌──────────────────┐
              │  packages/notify │  Slack delivery
              └──────────────────┘
                        │
              ┌─────────┴──────────┐
              │                    │
         high/medium            low urgency
         → immediate         → batched digest
              │                    │
         Slack message        Digest cron job
```

---

## Monorepo structure

```
bother-me-not/
├── apps/
│   ├── api/          Fastify server — webhook ingestion
│   ├── worker/       BullMQ worker — rule-based evaluator
│   └── ai-engine/    BullMQ worker — AI evaluator (Mastra + Claude)
│
└── packages/
    ├── contracts/    Zod schemas + inferred types shared across all apps
    ├── db/           Drizzle ORM — schema, migrations, repo layer
    ├── domain/       Pure TypeScript types — Signal, EvaluationResult shapes
    ├── queue/        BullMQ queue definitions (shared connection + queue names)
    └── notify/       Slack delivery — called by both evaluators
```

---

## Package responsibilities

### `packages/contracts`

The single source of truth for all data shapes that cross a process boundary (HTTP body, queue job payload, AI output).

| Schema | Purpose |
|---|---|
| `signalSchema` | Validates the normalized signal shape |
| `signalIntakeResponseSchema` | API response shape for webhook ingestion |
| `evaluationResultSchema` | What every evaluator must return |
| `ProcessSignalJobData` | BullMQ job payload shape |

All schemas are Zod objects. TypeScript types are inferred from them with `z.infer` — never written manually.

### `packages/domain`

Pure TypeScript types for business concepts. No Zod, no runtime code — compile-time only.

| Type | Purpose |
|---|---|
| `Signal` | The normalized, source-agnostic event |
| `SignalStatus` | `received \| processing \| processed \| failed` |
| `SignalSource` | `"github"` (extensible union) |
| `SignalType` | All known event types |
| `AIOutput` / `DeliveryDecision` | AI engine output shapes (to be unified with `EvaluationResult`) |

### `packages/db`

Drizzle ORM layer. The `signals` table is the only table in v1.

**Schema:**
```
signals
  id              uuid PK
  source          text           ("github")
  external_id     text           (GitHub delivery ID — dedup key)
  type            text           (event type)
  payload         jsonb          (normalized SignalPayload)
  raw_payload     jsonb          (original webhook body, untouched)
  status          text           (received → processing → processed/failed)
  received_at     timestamptz
```

Uniqueness constraint on `(source, external_id)` — duplicate webhooks are safe.

**Repo methods:**
- `insertSignal` — idempotent insert with conflict detection
- `findById` — lookup by UUID
- `findBySourceAndExternalId` — dedup check
- `updateStatus` — lifecycle transitions
- `updateFormatted` — store AI output alongside the signal (column pending migration)

### `packages/queue`

BullMQ queue definitions. Both queues share a single Redis connection config.

| Queue name | Consumer |
|---|---|
| `ai-engine-processing` | `apps/ai-engine` |
| `signal-processing` | `apps/worker` |

### `packages/notify`

Slack delivery. Called by both evaluators after they produce an `EvaluationResult`. Currently empty — v1 target.

### `packages/config`

Shared TypeScript compiler config (`tsconfig.base.json`).

---

## Apps

### `apps/api`

**Fastify** HTTP server. Entry point for all external events.

Responsibilities:
1. Receive `POST /webhooks/github`
2. Verify HMAC-SHA256 signature (`x-hub-signature-256`)
3. Normalize raw GitHub payload → `Signal` via `normalizeGithubPayload()`
4. Deduplicate via `signalsRepo.insertSignal()` (returns `duplicate: true` if seen before)
5. Route the signal to the correct queue — **one queue, not both**
6. Return `{ received: true, signalId, duplicate }` to GitHub immediately (< 10s SLA)

The routing decision (`ai` path vs `rules` path) lives here and is the only place it is made.

### `apps/worker`

**BullMQ worker** consuming `signal-processing`. The cheap, rule-based evaluation path.

Responsibilities:
- Apply deterministic rules to produce an `EvaluationResult`
- No LLM calls, no token cost
- Call `packages/notify` with the result
- Update signal status

Example rules (to be implemented):
- `ci_run_succeeded` → `deliver: false`
- `ci_run_failed` on default branch → `deliver: true, urgency: "high"`
- PR from dependabot → `deliver: false`

### `apps/ai-engine`

**BullMQ worker** consuming `ai-engine-processing`. The AI evaluation path.

Responsibilities:
- Fetch signal from DB
- Format signal as readable text prompt
- Run through Mastra agent (Claude)
- Receive structured `EvaluationResult`
- Persist result to DB
- Call `packages/notify` if `deliver: true`
- Update signal status

**AI stack:** Mastra (`@mastra/core`) + Anthropic Claude (`claude-sonnet-4-5`)

> ⚠️ **Note:** `package.json` currently lists `@mastra/openai`. This should be `@mastra/anthropic` to match `ANTHROPIC_API_KEY` and `LLM_MODEL=claude-sonnet-4-5` in `.env`.

**Internal file structure:**
```
apps/ai-engine/src/
  index.ts          BullMQ worker setup — registers handler
  handle.ts         Job handler — orchestrates the full flow
  signalAgent.ts    Mastra agent definition + system prompt
  formatSignal.ts   Signal → prompt string (pure function, no side effects)
```

---

## Data flow (detailed)

### Ingestion path (synchronous, < 10s)

```
POST /webhooks/github
  → verify signature                     (reject 401 if invalid)
  → parse headers: delivery ID, event    (reject 400 if missing)
  → normalizeGithubPayload()             (returns null if event is unrecognised → 200 no-op)
  → signalsRepo.insertSignal()           (idempotent — dedup on source+externalId)
  → if !duplicate → enqueue to ONE queue
  → return { received: true, signalId, duplicate }
```

### AI evaluation path (async, background)

```
job dequeued from ai-engine-processing
  → signalsRepo.findById(signalId)
  → updateStatus("processing")
  → formatSignal(signal) → string
  → signalAgent.generate(prompt, { output: evaluationResultSchema })
  → persist EvaluationResult to DB
  → if deliver → notify(signal, result)
  → updateStatus("processed")
  → [on error] updateStatus("failed"), rethrow for BullMQ retry
```

### Rule evaluation path (async, background)

```
job dequeued from signal-processing
  → signalsRepo.findById(signalId)
  → updateStatus("processing")
  → applyRules(signal) → EvaluationResult
  → if deliver → notify(signal, result)
  → updateStatus("processed")
```

---

## The shared contract

Both evaluators must return this shape. Nothing downstream cares which evaluator ran.

```ts
// packages/contracts/src/evaluation.schema.ts
{
  deliver:   boolean
  urgency:   "high" | "medium" | "low"
  reason:    string        // why this decision was made (audit trail)
  evaluator: "ai" | "rules"
}
```

> **Pending:** `channelMessage: string` needs to be added — the pre-formatted Slack message the agent composes. Without it, `packages/notify` has to format the message itself, which means it needs to know about signal shapes.

---

## Notification delivery

### Immediate (high / medium urgency)

Slack message posted to `SLACK_DEFAULT_CHANNEL` with the `channelMessage` from the evaluator.

### Digest (low urgency)

Low-priority signals are batched and sent as a single digest on a cron schedule (`DIGEST_CRON`, default every hour). Keeps the channel clean.

### Escalation

Unacknowledged high-priority alerts escalate after `SLACK_ESCALATION_TIMEOUT_MINUTES` (default 30 min).

---

## Infrastructure

Local dev runs fully in Docker:

```yaml
postgres:16    port 5435   (notification_db)
redis:7        port 6379
```

Start with: `docker compose up -d`

Apps run outside Docker in dev, connecting to the containerised services.

---

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres connection string |
| `REDIS_HOST` / `REDIS_PORT` | ✅ | BullMQ connection |
| `GITHUB_WEBHOOK_SECRET` | ✅ | HMAC webhook verification |
| `ANTHROPIC_API_KEY` | ✅ (ai-engine) | Claude API access |
| `LLM_MODEL` | ✅ (ai-engine) | Model ID (`claude-sonnet-4-5`) |
| `SLACK_BOT_TOKEN` | ✅ (notify) | Slack bot posting token |
| `SLACK_DEFAULT_CHANNEL` | ✅ (notify) | Target channel |
| `SLACK_SIGNING_SECRET` | ✅ (notify) | Verify Slack callbacks |
| `SLACK_ESCALATION_TIMEOUT_MINUTES` | optional | Default: 30 |
| `EMBEDDINGS_MODEL` | future | pgvector correlation stage |
| `DIGEST_CRON` | optional | Default: `0 * * * *` (hourly) |
| `PORT` | optional | API server port, default 3000 |

---

## Build status

| Component | Status | Notes |
|---|---|---|
| `apps/api` — ingestion, verification, dedup, routing | ✅ Done | `normalizeGithubPayload` needs verification |
| `packages/db` — schema, migrations, repo | ✅ Done | `formatted` column pending migration |
| `packages/queue` — queue definitions | ✅ Done | |
| `packages/contracts` — signal + evaluation schemas | ✅ Done | Add `channelMessage` to `evaluationResultSchema` |
| `apps/ai-engine` — Mastra agent + handler | 🔧 In progress | `signalAgent.ts` empty, `handle.ts` is a stub |
| `apps/worker` — rule engine | 🔧 Stub | Handler logs only |
| `packages/notify` — Slack delivery | ❌ Not started | Empty export |
| Digest batch job | ❌ Not started | Cron + low-urgency accumulation |
| Slack escalation | ❌ Not started | Timeout + re-alert logic |

---

## Design decisions

**AI as a plugin, not the core.** The pipeline works without AI. The worker provides a rule-based path that runs when AI is not needed, too costly, or unavailable. Both paths are first-class.

**One queue per signal, not both.** The routing decision happens at ingestion. A signal goes to either `ai-engine-processing` OR `signal-processing` — not both. This prevents duplicate processing and keeps token usage predictable.

**Evaluators own nothing downstream.** Both evaluators call `packages/notify` — they do not implement delivery themselves. Notify is the single delivery abstraction.

**Idempotent ingestion.** GitHub can re-deliver webhooks. The `(source, external_id)` unique constraint with `onConflictDoNothing` makes repeated deliveries safe at the DB level.

**API responds immediately.** The webhook endpoint returns before any evaluation happens. Evaluation is fully async via BullMQ. This keeps GitHub happy (< 10s response SLA) and makes the system resilient to slow AI calls.

**`EvaluationResult` is the boundary.** Everything before it is source-aware (GitHub-specific normalization, header verification). Everything after it is source-agnostic (notify, status updates, auditing). Adding a new source (Linear, Slack, PagerDuty) means a new ingestion app — zero changes to evaluation or delivery.

---

## Future: multi-source

The architecture is designed to support additional event sources without modifying the core pipeline.

To add a new source (e.g. Linear):

1. Create `apps/linear-api` with its own signature verification and normalizer
2. Extend `SignalSource` union: `"github" | "linear"`
3. Add new `SignalType` values for Linear events
4. The normalizer maps Linear payload → `Signal`
5. Everything downstream (queues, evaluators, notify) is unchanged

The `source` column in the DB is plain `text` — no migration needed.
