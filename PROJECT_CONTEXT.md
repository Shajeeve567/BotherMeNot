# Project Context: AI Attention Orchestration Engine

## 1. What is this project?

This project is an AI-powered attention orchestration system for developer and engineering signals.

The system receives a stream of events such as:

* GitHub issues
* Pull requests
* CI/CD failures
* Monitoring alerts
* System incidents
* Security alerts
* Other engineering-related signals

It then determines whether an event deserves a person's attention.

The system should answer questions such as:

* Is this event important?
* Is it relevant to this specific person or team?
* Is it urgent?
* Is it a duplicate of an existing incident?
* Does it represent a new incident?
* Should the user be notified?
* Through which channel?
* How should the information be summarized?
* Should the system escalate if the notification is not acknowledged?

The central idea is:

> **The system should reduce information overload by deciding what deserves human attention, while reliably delivering important notifications.**

This is not intended to be a generic automation platform or a simple LLM wrapper.

---

# 2. The core problem

Modern software systems generate a large amount of information:

```text
GitHub activity
       +
CI/CD events
       +
Monitoring alerts
       +
Security events
       +
Team communication
       +
System notifications
```

Most of these events do not deserve immediate human attention.

However, traditional systems commonly use simple rules:

```text
IF event occurs
THEN send notification
```

This leads to:

* notification overload
* alert fatigue
* duplicate notifications
* irrelevant interruptions
* important events being buried among noise

This project explores a different approach:

```text
Incoming Signal
      ↓
Understand the Signal
      ↓
Retrieve Relevant Context
      ↓
Determine Importance
      ↓
Determine Relevance
      ↓
Determine Urgency
      ↓
Decide Whether to Notify
      ↓
Compose the Appropriate Message
      ↓
Deliver Reliably
```

The AI is used for judgment and understanding.

The backend is responsible for reliability, consistency, state, and enforcement.

---

# 3. The central principle

The system is based on the following principle:

> **AI makes probabilistic decisions. Backend systems enforce deterministic guarantees.**

For example, an AI model may decide:

```json
{
  "decision": "notify",
  "urgency": "critical",
  "importance_score": 0.94,
  "reason": "Production API appears to be unavailable"
}
```

The backend must then determine:

* Is this event a duplicate?
* Is there already an active incident?
* Has this notification already been delivered?
* Is the recipient valid?
* Is the user currently in quiet hours?
* Is the selected channel available?
* Should the notification be escalated?

The LLM should not directly control external side effects.

The LLM can recommend:

```text
"Send a critical notification to the on-call engineer."
```

The backend decides whether and how that action is actually performed.

---

# 4. The core domain model

The primary domain entities are:

```text
Signal
   ↓
Incident
   ↓
Attention Decision
   ↓
Notification
   ↓
Delivery Attempt
   ↓
Acknowledgment
```

## Signal

A signal represents something that happened.

Examples:

* A GitHub issue was created.
* A CI pipeline failed.
* A production service became unavailable.
* A security alert was generated.

A signal is an external event entering the system.

---

## Incident

An incident represents a group of related signals.

For example:

```text
Signal 1: API latency increased
Signal 2: Database connection timeout
Signal 3: Health check failed
Signal 4: API requests failing
```

These may all represent one underlying incident.

The system should attempt to avoid treating every individual event as an independent notification.

Instead:

```text
Multiple Related Signals
          ↓
    One Incident
          ↓
    One Notification
```

Event correlation and deduplication are important parts of the system.

---

## Attention Decision

An attention decision determines what should happen with a signal or incident.

Possible decisions:

```text
NOTIFY
SUPPRESS
DEFER
ESCALATE
```

The decision may include:

```text
Importance
Urgency
Relevance
Confidence
Reason
Recommended Channel
Recommended Recipient
```

Example:

```json
{
  "decision": "notify",
  "urgency": "high",
  "importance_score": 0.91,
  "relevance_score": 0.87,
  "reason": "This appears to affect a production service owned by the recipient.",
  "recommended_channel": "slack"
}
```

---

## Notification

A notification is the actual communication intended for a person or team.

It contains:

* recipient
* channel
* message
* urgency
* source incident
* delivery status
* idempotency key

---

## Delivery Attempt

A notification may require multiple delivery attempts.

Example:

```text
Attempt 1 → Failed
      ↓
Retry
      ↓
Attempt 2 → Succeeded
```

The system must track delivery attempts separately from the notification itself.

---

## Acknowledgment

Some notifications require confirmation that the recipient has seen or acknowledged them.

Example:

```text
Notification Delivered
        ↓
Wait 10 minutes
        ↓
Acknowledged?
   ┌────┴────┐
  Yes        No
   │          │
   ▼          ▼
 Done      Escalate
```

---

# 5. High-level architecture

The system is an event-driven backend with an AI decision layer.

```text
                         ┌──────────────────┐
                         │ External Signals │
                         │                  │
                         │ GitHub           │
                         │ CI/CD            │
                         │ Monitoring       │
                         │ Webhooks         │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Signal Ingestion │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Event Normalizer │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Event Correlator │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Context Builder  │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │    AI Judge      │
                         │                  │
                         │ Notify?          │
                         │ How urgent?      │
                         │ Who?             │
                         │ Why?             │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  Policy Engine   │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
                SUPPRESS                       NOTIFY
                    │                           │
                    ▼                           ▼
                 Store                      Compose
                                                │
                                                ▼
                                             Route
                                                │
                                                ▼
                                             Queue
                                                │
                                                ▼
                                            Deliver
                                                │
                                    ┌───────────┴───────────┐
                                    ▼                       ▼
                               Acknowledged             Not Acknowledged
                                    │                       │
                                    ▼                       ▼
                                   Done                  Escalate
```

---

# 6. The AI engineering layer

The AI layer should not simply be:

```text
Event → LLM → Notification
```

Instead, it should provide the model with relevant context.

```text
New Signal
    │
    ├── User Preferences
    ├── Similar Historical Events
    ├── Active Incidents
    ├── Knowledge Base
    ├── Previous Decisions
    └── Current System State
    │
    ▼
Context Builder
    │
    ▼
AI Judge
    │
    ▼
Structured Decision
    │
    ▼
Validation
    │
    ▼
Policy Engine
```

The AI engineering components include:

* LLM integration
* structured outputs
* prompt engineering
* context construction
* embeddings
* semantic similarity
* vector search
* RAG
* event correlation
* AI evaluation
* model decision analysis

The goal is not to use AI everywhere.

AI should be used where semantic understanding and judgment are valuable.

---

# 7. RAG and context retrieval

The system should be able to retrieve relevant information before making a decision.

For example:

```text
New Signal:
"Database connection timeout detected in production."
```

The system may retrieve:

```text
- Similar previous incidents
- Related active alerts
- Relevant runbooks
- Previous resolutions
- Team ownership information
- User preferences
```

The process:

```text
New Signal
    ↓
Generate Embedding
    ↓
Search pgvector
    ↓
Retrieve Relevant Context
    ↓
Build Model Context
    ↓
AI Judge
```

The project should explore how retrieval improves decision quality.

The system should not blindly pass all historical data to the model.

Relevant context must be selected.

---

# 8. Semantic event correlation

One important AI feature is identifying related events.

For example:

```text
"Database connection timeout"
"Postgres connection failure"
"Database unavailable"
```

These events may represent the same underlying problem.

The system may use:

```text
Semantic Similarity
        +
Metadata
        +
Time
        +
Source
        +
AI Reasoning
```

to determine whether events belong to the same incident.

The general process:

```text
New Signal
    ↓
Vector Search
    ↓
Find Similar Existing Signals
    ↓
Candidate Incidents
    ↓
Correlation Decision
    ↓
Existing Incident OR New Incident
```

The system should avoid sending multiple notifications about the same underlying issue.

---

# 9. Reliability is a core feature

Reliability is not an optional infrastructure layer.

It is part of the product's purpose.

If the system decides that a critical event deserves attention, the notification must be delivered reliably.

The system should eventually support:

## Retries

```text
Attempt 1
    ↓
Failure
    ↓
Backoff
    ↓
Attempt 2
    ↓
Success
```

---

## Idempotency

A worker may execute the same job more than once.

The side effect should happen only once.

The goal is:

> **At-least-once processing with idempotent side effects.**

Example:

```text
Job executes
    ↓
Slack message successfully sent
    ↓
Worker crashes before recording success
    ↓
Job retries
    ↓
System detects existing idempotency key
    ↓
No duplicate notification
```

---

## Timeouts

External operations should not run forever.

```text
Start Delivery
      ↓
Timeout
      ↓
Mark Attempt Failed
      ↓
Retry or Escalate
```

---

## Crash Recovery

If the system crashes during processing:

```text
Signal
  ↓
Incident Created
  ↓
AI Decision Completed
  ↓
System Crashes
```

After restarting:

```text
Read Persistent State
        ↓
Determine Last Completed Step
        ↓
Continue Safely
```

The system should not blindly restart the entire process.

---

# 10. Recommended technology stack

## Backend

* TypeScript
* Node.js
* Fastify
* Zod

## Database

* PostgreSQL
* pgvector
* Drizzle ORM

## Asynchronous processing

* Redis
* BullMQ

## AI

* LLM API
* Embeddings API
* Structured outputs
* Zod validation

## Observability

* Pino for structured logging
* OpenTelemetry for tracing

## Testing

* Vitest
* Integration tests
* AI evaluation datasets

## Infrastructure

* Docker
* Docker Compose

The initial system should remain simple enough to run locally.

---

# 11. What this project is intended to teach

This project is intentionally designed to improve backend engineering and AI engineering simultaneously.

## Backend engineering goals

Learn and practice:

* TypeScript architecture
* API design
* domain modeling
* PostgreSQL schema design
* transactions
* indexes
* queues
* workers
* asynchronous processing
* retries
* idempotency
* state machines
* scheduling
* concurrency
* race conditions
* distributed locks
* observability
* failure recovery

---

## AI engineering goals

Learn and practice:

* LLM API integration
* prompt engineering
* structured outputs
* function/tool calling where appropriate
* embeddings
* vector databases
* semantic similarity
* RAG
* context construction
* event correlation
* AI evaluation
* false-positive and false-negative analysis
* model reliability

---

# 12. Architectural principles

The project should follow these principles.

## Principle 1: AI should not own critical side effects

The LLM can recommend:

```text
"Notify the on-call engineer."
```

The backend decides:

```text
- Is this valid?
- Is this a duplicate?
- Is the user eligible?
- Has it already been sent?
- Which channel should actually be used?
```

---

## Principle 2: Persist important state

Important state should not exist only in memory.

If the process crashes, the system should be able to recover from PostgreSQL.

---

## Principle 3: Prefer explicit state transitions

Instead of arbitrary status changes:

```text
notification.status = "anything"
```

Use valid transitions:

```text
PENDING → QUEUED → DELIVERING → DELIVERED
```

---

## Principle 4: Separate domain logic from infrastructure

The domain should not directly depend on:

```text
Fastify
Redis
BullMQ
OpenAI
```

The core domain should express what needs to happen.

Infrastructure implements how it happens.

---

## Principle 5: Start with one complete vertical slice

The first working flow should be:

```text
GitHub Signal
      ↓
Normalize
      ↓
Persist
      ↓
Queue
      ↓
Worker
      ↓
Retrieve Context
      ↓
AI Judge
      ↓
Policy Evaluation
      ↓
Compose Notification
      ↓
Deliver to Slack
      ↓
Track Delivery
```

A complete working flow is more valuable than many incomplete integrations.

---

# 13. Initial project scope

The initial version should focus on developer and engineering signals.

Initial input:

```text
GitHub Events
```

Initial output:

```text
Slack Notifications
```

Initial end-to-end flow:

```text
GitHub Event
      ↓
Signal Ingestion
      ↓
Event Normalization
      ↓
PostgreSQL
      ↓
BullMQ
      ↓
Worker
      ↓
Context Retrieval
      ↓
AI Judge
      ↓
Policy Engine
      ↓
Notification Composer
      ↓
Slack Delivery
      ↓
Idempotency
      ↓
Delivery Tracking
```

Future extensions may include:

* CI/CD events
* monitoring alerts
* email
* SMS
* WhatsApp
* push notifications
* escalation policies
* acknowledgment workflows
* multiple users and teams

These should not be implemented before the core architecture is stable.

---

# 14. The project's success criteria

The project should not be judged by how many integrations it supports.

The primary success criteria are:

### 1. Can the system correctly process an incoming signal?

```text
Signal → Persisted → Processed
```

### 2. Can the AI make a structured attention decision?

```text
Signal + Context → Decision
```

### 3. Can the system suppress irrelevant events?

```text
Noise → No Notification
```

### 4. Can the system correlate related events?

```text
Many Signals → One Incident
```

### 5. Can the system deliver important notifications reliably?

```text
Important Event → Notification Delivered
```

### 6. Can the system recover from failure?

```text
Failure → Retry / Recover / Continue
```

### 7. Can the system prevent duplicate side effects?

```text
Repeated Processing → One Notification
```

---

# 15. Guidance for AI coding assistants

When modifying this repository, AI coding assistants should understand the following:

This is primarily a backend engineering project with AI decision-making capabilities.

Do not turn the project into:

* a generic chatbot
* a simple LLM wrapper
* a generic n8n clone
* a collection of disconnected AI features
* a frontend-first application

Prioritize:

1. Correct domain modeling
2. Reliable state transitions
3. Clear boundaries between domain and infrastructure
4. Durable asynchronous processing
5. Idempotent side effects
6. Testability
7. Observability
8. AI decisions that are structured and validated
9. Context retrieval that is relevant and explainable
10. Simple architecture before unnecessary abstraction

When implementing a feature, ask:

> Does this improve the system's ability to understand signals, make better attention decisions, or reliably deliver the resulting action?

If not, it may not belong in the current scope.

---

# 16. The project's central thesis

The project explores the following idea:

> **The future of notification systems should not be about delivering every event faster. It should be about intelligently deciding which events deserve human attention, while ensuring that important decisions are delivered reliably.**

The AI provides the intelligence.

The backend provides the reliability.

The combination is the project.
