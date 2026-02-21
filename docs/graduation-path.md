# Graduation Path to Standalone

When you need real exponential growth (more agents, more throughput, production scale), move from Cursor to a standalone (or hybrid) service.

## What to Move Out of Cursor

| Component | In Cursor | In Standalone |
|-----------|-----------|---------------|
| **Task queue** | List of `mcp_task` invocations per turn | Persistent queue (Redis, SQS, in-memory) |
| **Worker pool** | `mcp_task` subagents (ephemeral) | Long-lived worker processes/threads |
| **Shared state** | `context.md` (file) | Database or key-value store (Postgres, Redis) |
| **Central brain** | Main Cursor agent | Orchestrator process that calls an LLM (Claude API, etc.) |
| **Outcomes** | `outcomes/` (files) | Outcomes table or blob store |

## Roadmap

### Phase 1: Extract orchestrator logic (done)

- Document the central brain’s decision flow (read context → decide tasks → assign → ingest outcomes → update context).
- Implement this flow in code (Node, Python, Ruby) as a function or service that:
  - Takes goals + context
  - Returns task assignments
  - Ingests outcomes and returns updated context

**Implemented:** `core/` adapters (file-context-store, file-outcome-store, llm-provider), `api-server.mjs` (POST /api/hive/cycle uses LLM when anthropic/openai/ollama configured), `mcp-server/` with hive tools.

### Phase 2: Add task queue and workers

- Add a task queue (e.g. Redis LIST, Bull, Celery).
- Central brain pushes tasks to the queue.
- Workers pull tasks, execute (call LLM + tools), write outcomes.
- Central brain pulls outcomes and updates shared state.

### Phase 3: Replace file-based state with a store

- Migrate `context.md` to a DB schema (goals, strategy, learnings, outcome digest).
- Migrate `outcomes/` to an outcomes table or blob store.
- Orchestrator and workers read/write via API or direct DB access.

### Phase 4: Scale workers

- Run multiple worker instances (horizontal scaling).
- Queue depth and worker count determine throughput.
- Central brain can run on a schedule or event-driven; workers scale independently.

## Hybrid Option

Keep Cursor in the loop for high-level strategy:

- Cursor handles: goal setting, ad-hoc exploration, human-in-the-loop decisions.
- Standalone service handles: durable queue, worker pool, outcome ingestion, throughput scaling.

Cursor sends “assign these tasks” to your service; service runs workers and reports outcomes back. Cursor updates context and decides next steps.
