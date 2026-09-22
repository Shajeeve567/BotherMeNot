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
| `aiOutputSchema` | What the AI model returns (no `evaluator` field — model does not self-label) |
| `evaluationResultSchema` | `aiOutputSchema` extended with `evaluator: "ai" \| "rules"` — stamped by calling code |
| `ProcessSignalJobData` | BullMQ job payload: `{ signalId: string, projectId: string }` |
| `createProjectSchema` | Validated input for project creation |

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

Drizzle ORM layer.

**Schema:**
```
users
  id                  uuid PK
  github_id           text UNIQUE NOT NULL
  github_username     text NOT NULL
  github_access_token text NOT NULL
  created_at          timestamptz NOT NULL

projects
  id                      uuid PK
  user_id                 uuid FK → users.id NOT NULL
  name                    text NOT NULL
  github_installation_id  text UNIQUE      (set after GitHub App is installed)
  slack_channel           text             (per-project override; falls back to SLACK_DEFAULT_CHANNEL)
  ai_context              text             (injected into agent system prompt)
  created_at              timestamptz NOT NULL

project_repos
  id               uuid PK
  project_id       uuid FK → projects.id NOT NULL
  repo_full_name   text NOT NULL    (e.g. "owner/repo-name")
  created_at       timestamptz NOT NULL
  UNIQUE(project_id, repo_full_name)

signals
  id              uuid PK
  project_id      uuid FK → projects.id   (nullable for legacy signals)
  source          text           ("github")
  external_id     text           (GitHub delivery ID — dedup key)
  type            text           (event type)
  payload         jsonb          (normalized SignalPayload)
  raw_payload     jsonb          (original webhook body, untouched)
  status          text           (received → processing → processed/failed)
  received_at     timestamptz
```

Uniqueness constraint on `(source, external_id, project_id)` — duplicate webhooks are safe. The constraint includes `project_id` to allow the same event to fan-out to multiple projects when a repo belongs to more than one installation.

**Repo methods — signals:**
- `insertSignal` — idempotent insert with conflict detection
- `findById` — lookup by UUID
- `findBySourceAndExternalId` — dedup check
- `updateStatus` — lifecycle transitions
- `updateFormatted` — store AI output alongside the signal

**Repo methods — users:**
- `upsert` — find-or-create on GitHub OAuth callback

**Repo methods — projects:**
- `create`, `findById`, `findByUserId`, `findByInstallationId`, `update`, `delete`

**Repo methods — project_repos:**
- `addRepo`, `removeRepo`, `findByProjectId`

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

**Fastify** HTTP server. Entry point for all external events and the user-facing REST API.

**Auth plugin (`src/plugins/auth.ts`):** registers `@fastify/jwt` + `@fastify/cookie`. Exposes a `request.authenticate()` decorator that verifies the JWT from the session cookie and attaches `request.user`.

**Route groups:**

| Route | Purpose |
|---|---|
| `GET /auth/github` | Redirects to GitHub OAuth |
| `GET /auth/github/callback` | Exchanges code for token, upserts user, sets JWT cookie |
| `GET /auth/me` | Returns current authenticated user |
| `POST /api/projects` | Creates a project; returns `{ id, connectUrl }` where `connectUrl` is the GitHub App install URL with `?state=<projectId>` |
| `GET /api/projects` | Lists the current user's projects |
| `GET /api/projects/:id` | Gets project + repo list |
| `PATCH /api/projects/:id` | Updates name / ai_context / slack_channel |
| `DELETE /api/projects/:id` | Deletes project |
| `POST /webhooks/github/app` | GitHub App webhook — all installations fan in here |
| `POST /webhooks/github` | Legacy single-repo webhook (kept for local dev / testing) |

**GitHub App webhook responsibilities (`POST /webhooks/github/app`):**
1. Verify HMAC-SHA256 using `GITHUB_APP_WEBHOOK_SECRET`
2. Handle `installation` event → associate `installation.id` with the project identified by the `state` param
3. Handle `installation_repositories` event → sync repos into `project_repos`
4. All other events → look up project by `installation.id`, normalize payload → `Signal` with `project_id`, deduplicate, route to one queue with `{ signalId, projectId }`

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

**AI stack:** Mastra (`@mastra/core`) + Google Gemini (`@ai-sdk/google`, `gemini-2.5-flash`)

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
POST /webhooks/github/app
  → verify HMAC-SHA256 (GITHUB_APP_WEBHOOK_SECRET)       (reject 401 if invalid)
  → if installation/installation_repositories event
      → associate installation.id with project or sync repos
      → return 200 immediately
  → parse headers: delivery ID, event                    (reject 400 if missing)
  → look up project by installation.id                   (reject 404 if unknown installation)
  → normalizeGithubPayload()                             (returns null if unrecognised → 200 no-op)
  → signalsRepo.insertSignal({ ...signal, projectId })   (idempotent — dedup on source+externalId+projectId)
  → if !duplicate → enqueue { signalId, projectId } to ONE queue
  → return { received: true, signalId, duplicate }
```

### AI evaluation path (async, background)

```
job dequeued from ai-engine-processing  { signalId, projectId }
  → signalsRepo.findById(signalId)
  → projectsRepo.findById(projectId)
  → updateStatus("processing")
  → formatSignal(signal, project.aiContext) → string
  → signalAgent.generate(prompt, { structuredOutput: { schema: aiOutputSchema } })
  → stamp result.evaluator = "ai"
  → signalsRepo.updateFormatted(signalId, result)
  → if deliver → notify(signal, result, { slackChannel: project.slackChannel ?? SLACK_DEFAULT_CHANNEL })
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
// packages/contracts/src/evalution.schema.ts

// What the AI model returns — model does NOT self-label
const aiOutputSchema = z.object({
  deliver:  z.boolean(),
  urgency:  z.enum(["high", "medium", "low"]),
  reason:   z.string(),   // audit trail
  summary:  z.string(),   // pre-formatted message for Slack
  score:    z.number(),
});

// Calling code stamps the evaluator field after receiving model output
const evaluationResultSchema = aiOutputSchema.extend({
  evaluator: z.enum(["ai", "rules"]),
});
```

The split ensures the model never has to classify itself, which prevents prompt-injection attacks that could force the model to claim it is the `"rules"` evaluator.

---

## Notification delivery

### Immediate (high / medium urgency)

Slack message posted to `project.slack_channel` if set, otherwise falls back to `SLACK_DEFAULT_CHANNEL`. The message body comes from `result.summary`.

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
| `GITHUB_APP_ID` | ✅ | GitHub App ID |
| `GITHUB_APP_CLIENT_ID` | ✅ | OAuth client ID |
| `GITHUB_APP_CLIENT_SECRET` | ✅ | OAuth client secret |
| `GITHUB_APP_PRIVATE_KEY` | ✅ | PEM key for GitHub App JWT auth (base64 encoded) |
| `GITHUB_APP_WEBHOOK_SECRET` | ✅ | HMAC verification for App webhook events |
| `GITHUB_WEBHOOK_SECRET` | optional | Legacy single-repo webhook (local dev / testing only) |
| `JWT_SECRET` | ✅ | Signs user session tokens |
| `APP_URL` | ✅ | OAuth callback base URL (e.g. `http://localhost:3000`) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | ✅ (ai-engine) | Gemini API access |
| `SLACK_BOT_TOKEN` | ✅ (notify) | Slack bot posting token |
| `SLACK_DEFAULT_CHANNEL` | ✅ (notify) | Fallback channel (overridden by `project.slack_channel`) |
| `SLACK_SIGNING_SECRET` | ✅ (notify) | Verify Slack callbacks |
| `SLACK_ESCALATION_TIMEOUT_MINUTES` | optional | Default: 30 |
| `EMBEDDINGS_MODEL` | future | pgvector correlation stage |
| `DIGEST_CRON` | optional | Default: `0 * * * *` (hourly) |
| `PORT` | optional | API server port, default 3000 |

---

## Build status

| Component | Status | Notes |
|---|---|---|
| `apps/api` — ingestion, verification, dedup, routing | ✅ Done | Legacy single-repo webhook |
| `apps/api` — GitHub App webhook + installation flow | ❌ Not started | New route group needed |
| `apps/api` — GitHub OAuth + session auth | ❌ Not started | `@fastify/jwt`, `@fastify/cookie`, auth plugin |
| `apps/api` — project CRUD routes | ❌ Not started | Requires auth middleware |
| `packages/db` — users, projects, project_repos tables | ❌ Not started | Migration needed |
| `packages/db` — signals.project_id column | ❌ Not started | Nullable FK, update dedup constraint |
| `packages/db` — project/user repo methods | ❌ Not started | |
| `packages/queue` — queue definitions | ✅ Done | |
| `packages/contracts` — signal + evaluation schemas | ✅ Done | `aiOutputSchema` / `evaluationResultSchema` split done |
| `packages/contracts` — `ProcessSignalJobData` with `projectId` | ❌ Not started | Needs `projectId: string` added |
| `apps/ai-engine` — Mastra agent + structured output | ✅ Done | Google Gemini, `structuredOutput` API |
| `apps/ai-engine` — `formatSignal.ts` | ❌ Not started | Pure fn: signal + project context → prompt string |
| `apps/ai-engine` — `handle.ts` full flow | ❌ Not started | Load project, inject context, persist result, notify |
| `apps/worker` — rule engine | 🔧 Stub | Handler logs only; no rules implemented |
| `packages/notify` — Slack delivery | ❌ Not started | `@slack/web-api`, per-project channel support |
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

**GitHub App over per-repo webhook secrets.** One App installation covers all repos the user selects. The `installation.id` in every webhook payload is the single key that maps an event to its project, eliminating per-repo secret management and enabling fan-in through a single endpoint.

**GitHub OAuth for authentication.** Users already have a GitHub identity and the GitHub App requires it. A separate username/password auth system would add complexity for no benefit in v1.

**Per-project AI context.** Projects carry a free-text `ai_context` field injected at the top of the agent prompt. This lets users describe their repo's purpose and norms ("this is a payments service — treat any security alert as high urgency") without changing any code.

**Model does not self-label.** The AI receives `aiOutputSchema` (no `evaluator` field). The calling code stamps `evaluator: "ai"` after the call. This prevents the model from being prompted or injected into claiming it is the `"rules"` evaluator.

**Solo project scope in v1.** Projects are owned by one user. Team/org-level sharing is deferred. This keeps the auth model simple: every project check is `project.user_id === request.user.id`.

---

## Decision Log

### 2026-09-20: Projects feature — multi-tenancy design
- **Status**: Accepted
- **Context**: The system needed user ownership, repo scoping, per-project notification config, and per-project AI context. The initial design was a single global webhook with no concept of users or projects.
- **Decision**: Add `users`, `projects`, and `project_repos` tables. Users authenticate via GitHub OAuth. Repos are connected through a GitHub App installation (one App, one webhook endpoint, `installation.id` as the routing key). Signals gain a `project_id` FK. AI agent receives `project.ai_context` as a prompt prefix. `packages/notify` accepts a per-project `slackChannel`.
- **Alternatives rejected**: Per-repo webhook secrets — rejected because it requires managing one secret per repo and does not scale; no GitHub App needed. Username/password auth — rejected because users already have GitHub accounts and the App requires OAuth anyway.
- **Consequences**: `ProcessSignalJobData` gains `projectId`. The dedup constraint changes from `(source, external_id)` to `(source, external_id, project_id)`. `apps/api` gains auth middleware, project CRUD routes, and a new GitHub App webhook route. `handle.ts` must load the project before formatting the prompt.

### 2026-09-20: Split evaluation schema — model does not self-label
- **Status**: Accepted
- **Context**: The original `evaluationResultSchema` included an `evaluator: "ai" | "rules"` field, requiring the AI model to classify itself. This is unnecessary and creates a prompt-injection surface.
- **Decision**: Split into `aiOutputSchema` (no `evaluator`) and `evaluationResultSchema` (extends with `evaluator`). Calling code stamps `evaluator: "ai"` after receiving model output.
- **Alternatives rejected**: Single schema with `evaluator` field in model output — rejected because the model should not label itself; the caller always knows which path it took.
- **Consequences**: `signalAgent.generate()` uses `structuredOutput: { schema: aiOutputSchema }`. The `evaluator` field is never sent to the model.

### 2026-09-20: Switch AI provider to Google Gemini
- **Status**: Accepted
- **Context**: Initial architecture specified Anthropic Claude. Provider was switched during implementation.
- **Decision**: Use `@ai-sdk/google` with `gemini-2.5-flash`. Environment variable is `GOOGLE_GENERATIVE_AI_API_KEY`.
- **Alternatives rejected**: Anthropic Claude — was the original choice; switched for cost/speed reasons.
- **Consequences**: `ANTHROPIC_API_KEY` and `LLM_MODEL` env vars are replaced by `GOOGLE_GENERATIVE_AI_API_KEY`.

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
