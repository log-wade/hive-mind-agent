# Datacenter NOC Hive — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the incident-response NOC hive that ingests from DCIM/BMS/ticketing, triages with an LLM, and acts via atomic tools (acknowledge, remediate, create ticket, notify), with rollout phases from shadow to full automation.

**Architecture:** Product `datacenter-noc` under hive-mind-agent-general: adapters per vendor (normalized alert/asset/ticket), atomic tools exposed to orchestrator, NOC cycle (ingest → LLM triage with tools → persist). Triggered by schedule and webhook; context and outcomes in existing hive.

**Tech Stack:** Node (ESM), existing hive core (context, outcomes, LLM), optional TypeScript for types; env-based secrets.

---

## Task 1: Create product directory and package

**Files:**
- Create: `hive-mind-agent-general/products/datacenter-noc/package.json`
- Create: `hive-mind-agent-general/products/datacenter-noc/README.md`

**Step 1: Create directory and package.json**

```json
{
  "name": "@hive-mind/datacenter-noc",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "NOC hive: ingest, triage, act on DCIM/BMS/ticketing",
  "main": "runner.mjs",
  "scripts": {
    "noc:cycle": "node runner.mjs",
    "test": "node --test test/*.test.mjs"
  },
  "dependencies": {},
  "engines": { "node": ">=18" }
}
```

**Step 2: Add README stub**

In `products/datacenter-noc/README.md`: one paragraph — "NOC hive for data center incident response. Integrates with DCIM/BMS/ticketing; triages with LLM; acknowledges, remediates (allow-list), or escalates via tickets. See docs/plans/2026-03-07-datacenter-noc-hive-design.md."

**Step 3: Commit**

```bash
git add hive-mind-agent-general/products/datacenter-noc/
git commit -m "chore(noc): add datacenter-noc product scaffold"
```

---

## Task 2: Define normalized types

**Files:**
- Create: `hive-mind-agent-general/products/datacenter-noc/types.mjs`

**Step 1: Add normalized Alert, Asset, Ticket shapes**

In `types.mjs` export plain objects (no runtime validation for now):

- `Alert`: id, source (string), severity (string), state (open|acknowledged|resolved), assetId, assetName, message, timestamp (ISO), raw (optional).
- `Asset`: id, name, type (e.g. cabinet, pdu), location (row/hall), metadata (optional).
- `Ticket`: id, source, title, body, status, priority, assignee (optional), createdAt, updatedAt (ISO), raw (optional).

**Step 2: Commit**

```bash
git add products/datacenter-noc/types.mjs
git commit -m "feat(noc): add normalized Alert, Asset, Ticket types"
```

---

## Task 3: Define adapter interface

**Files:**
- Create: `hive-mind-agent-general/products/datacenter-noc/adapters/index.mjs`

**Step 1: Document adapter contract**

In `adapters/index.mjs` export a single object `ADAPTER_CONTRACT` (or JSDoc) describing the interface each integration must implement:

- `readAlerts(options?: { source?, since? })` → Promise<Alert[]>
- `readMetrics(options: { assetId?, metricNames?, range })` → Promise<Array<{ metric, values }>>
- `readAssets(filter?)` → Promise<Asset[]>
- `readTickets(options?: { status?, queue? })` → Promise<Ticket[]>
- `readTicket(id)` → Promise<Ticket | null>
- `acknowledgeAlert(alertId)` → Promise<void>
- `runRemediation(procedureId, params)` → Promise<{ ok, message? }>
- `createTicket({ title, body, priority, assignee? })` → Promise<{ id }>
- `updateTicket(id, { body?, status? })` → Promise<void>

Not all adapters implement all methods; unimplemented return a clear error or throw "Not supported".

**Step 2: Commit**

```bash
git add products/datacenter-noc/adapters/index.mjs
git commit -m "feat(noc): define adapter interface"
```

---

## Task 4: Implement mock adapter

**Files:**
- Create: `hive-mind-agent-general/products/datacenter-noc/adapters/mock.mjs`
- Create: `hive-mind-agent-general/products/datacenter-noc/test/adapters-mock.test.mjs`

**Step 1: Write failing test**

In `test/adapters-mock.test.mjs`: `createMockAdapter()` returns an object; `readAlerts()` returns array of at least one Alert-shaped object; `acknowledgeAlert(id)` resolves without error.

**Step 2: Run test to verify it fails**

Run: `cd products/datacenter-noc && node --test test/adapters-mock.test.mjs`  
Expected: FAIL (mock not implemented).

**Step 3: Implement mock adapter**

In `adapters/mock.mjs`: implement createMockAdapter() with in-memory alerts (e.g. one open alert), readAlerts returns them, readMetrics/readTickets return empty arrays, acknowledgeAlert resolves, runRemediation/createTicket/updateTicket resolve with stub values.

**Step 4: Run test to verify it passes**

Run: `node --test test/adapters-mock.test.mjs`  
Expected: PASS.

**Step 5: Commit**

```bash
git add products/datacenter-noc/adapters/mock.mjs products/datacenter-noc/test/
git commit -m "feat(noc): add mock adapter and tests"
```

---

## Task 5: Implement tool layer (read_alerts, read_metrics)

**Files:**
- Create: `hive-mind-agent-general/products/datacenter-noc/tools.mjs`
- Create: `hive-mind-agent-general/products/datacenter-noc/test/tools.test.mjs`

**Step 1: Write failing test**

In `test/tools.test.mjs`: createTools(mockAdapter) returns object with read_alerts; calling read_alerts() returns normalized alerts (array).

**Step 2: Run test — expect fail**

Run: `node --test test/tools.test.mjs`  
Expected: FAIL.

**Step 3: Implement tools.mjs**

In `tools.mjs`: createTools(adapter) returns object. read_alerts(args) calls adapter.readAlerts(args) and returns result. read_metrics(args) calls adapter.readMetrics(args). Use same naming as design (read_alerts, read_metrics). Return values must be JSON-serializable for LLM consumption.

**Step 4: Run test — expect pass**

Run: `node --test test/tools.test.mjs`  
Expected: PASS.

**Step 5: Commit**

```bash
git add products/datacenter-noc/tools.mjs products/datacenter-noc/test/tools.test.mjs
git commit -m "feat(noc): add read_alerts and read_metrics tools"
```

---

## Task 6: Add remaining tools (acknowledge, ticket, context, complete_task)

**Files:**
- Modify: `hive-mind-agent-general/products/datacenter-noc/tools.mjs`
- Create: `hive-mind-agent-general/products/datacenter-noc/context.mjs` (read/write context helpers using hive core)

**Step 1: Implement context helpers**

In `context.mjs`: readContext(hiveRoot) and writeContext(hiveRoot, updates) using hive core readContext/writeContext from ../../core/index.mjs (or require HIVE_ROOT and paths from config). Export readContext, writeContext.

**Step 2: Add tools**

In `tools.mjs` add: acknowledge_alert(source, alertId), run_remediation(procedureId, params), create_ticket({ title, body, priority, assignee }), update_ticket(id, { body?, status }), notify(channel, message) — notify can console.log or stub. read_context(), write_context(updates) — delegate to context.mjs. complete_task(summary) — return summary for runner to persist. All take (adapter, contextHelpers) or equivalent so runner can inject.

**Step 3: Extend mock adapter**

Ensure mock adapter implements acknowledgeAlert, createTicket, updateTicket so tool tests can run.

**Step 4: Add tests for one write tool**

In test/tools.test.mjs: acknowledge_alert called with id from read_alerts does not throw; complete_task returns summary.

**Step 5: Run tests**

Run: `node --test test/tools.test.mjs`  
Expected: PASS.

**Step 6: Commit**

```bash
git add products/datacenter-noc/tools.mjs products/datacenter-noc/context.mjs products/datacenter-noc/test/tools.test.mjs
git commit -m "feat(noc): add acknowledge, ticket, context, complete_task tools"
```

---

## Task 7: NOC cycle runner (ingest → LLM → persist)

**Files:**
- Create: `hive-mind-agent-general/products/datacenter-noc/runner.mjs`
- Create: `hive-mind-agent-general/products/datacenter-noc/prompts.mjs`

**Step 1: Add system prompt**

In `prompts.mjs` export getSystemPrompt() returning the NOC brain system prompt from the design (Section 3): role, inputs, rules, output; include instruction to use complete_task at end.

**Step 2: Implement runCycle in runner.mjs**

In `runner.mjs`: runCycle(hiveRoot, config) (1) loads config (integrations, allow-list), (2) creates adapter(s) from config (start with mock if no env), (3) creates tools with adapter + context helpers, (4) reads context via read_context, (5) calls read_alerts (and optionally read_tickets), (6) builds user message with ingested data, (7) calls LLM (use createLLMProvider from core with config.adapters.llm) with system prompt + user message. Do not yet pass tools to LLM — single turn that returns a summary. (8) Writes outcome via hive core writeOutcome with summary. Export runCycle.

**Step 3: Add CLI entry**

When runner.mjs is run as main: load HIVE_ROOT from env, loadConfig(HIVE_ROOT), call runCycle(HIVE_ROOT, config). Log "Cycle complete" or error.

**Step 4: Manual test**

Run: `HIVE_ROOT=/path/to/hive node products/datacenter-noc/runner.mjs` with a hive that has context.md and hive.config.json with adapters.llm (e.g. anthropic). Expect one cycle: ingest mock alerts, one LLM call, one outcome file.

**Step 5: Commit**

```bash
git add products/datacenter-noc/runner.mjs products/datacenter-noc/prompts.mjs
git commit -m "feat(noc): NOC cycle runner with single-turn LLM and outcome"
```

---

## Task 8: Wire LLM tool-use loop (triage with tools)

**Files:**
- Modify: `hive-mind-agent-general/products/datacenter-noc/runner.mjs`
- Modify: `hive-mind-agent-general/core/adapters/llm-provider.mjs` (optional: add completeWithTools if not present) OR use a simple in-runner loop that parses LLM output for tool calls (e.g. JSON block) and invokes tools, then re-calls LLM until complete_task is seen.

**Step 1: Choose approach**

If hive core LLM adapter already supports tool/function calling (Anthropic/OpenAI), add completeWithTools( messages, tools ) and use it. Otherwise implement a minimal loop in runner: prompt the LLM with "Available tools: ... Current state: ... Respond with either a JSON object { tool, args } or { complete_task: summary }." Loop: call LLM → if complete_task, break and persist summary; else call tool, append result to conversation, repeat. Max 30 iterations or 2 min timeout.

**Step 2: Implement loop in runner**

In runner.mjs replace single LLM call with tool loop. Pass tool list (names + descriptions) and current state (context + ingested alerts). On each response, if it's complete_task, write outcome and exit. Otherwise invoke the requested tool (with allow-list check for run_remediation), append result, call LLM again.

**Step 3: Update system prompt**

In prompts.mjs specify exact response format for tool use (e.g. JSON) so the runner can parse reliably.

**Step 4: Manual test**

Run one cycle with mock adapter; LLM should see alerts, optionally call read_metrics, then acknowledge_alert or create_ticket, then complete_task. Check outcome file content.

**Step 5: Commit**

```bash
git add products/datacenter-noc/runner.mjs products/datacenter-noc/prompts.mjs
git commit -m "feat(noc): triage loop with LLM tool use"
```

---

## Task 9: Config schema and remediation allow-list

**Files:**
- Create: `hive-mind-agent-general/products/datacenter-noc/config.schema.json` (optional)
- Modify: `hive-mind-agent-general/products/datacenter-noc/runner.mjs`
- Create: `hive-mind-agent-general/products/datacenter-noc/noc.config.example.json`

**Step 1: Example config**

In `noc.config.example.json` (or document in README): integrations (e.g. mock, vertiv), each with baseUrl/env keys; remediationAllowList: [ "procedure_id_1", "procedure_id_2" ]; notifyChannels (e.g. slack webhook). Runner loads this from hive root (e.g. noc.config.json) or from hive.config.json under key "noc".

**Step 2: Enforce allow-list in run_remediation**

In tools.mjs run_remediation: if procedureId not in config.remediationAllowList, return { ok: false, message: "Procedure not allowed" } without calling adapter.

**Step 3: Commit**

```bash
git add products/datacenter-noc/noc.config.example.json products/datacenter-noc/runner.mjs products/datacenter-noc/tools.mjs
git commit -m "feat(noc): config and remediation allow-list"
```

---

## Task 10: Schedule and webhook trigger

**Files:**
- Create: `hive-mind-agent-general/products/datacenter-noc/scheduler.mjs`
- Modify: `hive-mind-agent-general/workflows/runner.mjs` (optional) OR add standalone scheduler in products/datacenter-noc that runs runCycle on interval + HTTP server for webhook

**Step 1: Standalone scheduler**

In `products/datacenter-noc/scheduler.mjs`: load HIVE_ROOT and config; use setInterval (e.g. 60_000 ms) to call runCycle. Optionally start a minimal HTTP server (e.g. port 3743) with POST /webhook that calls runCycle and returns 200. Document in README: run with `node scheduler.mjs` for 24/7; call POST /webhook for event-driven.

**Step 2: Document env**

README: HIVE_ROOT, NOC_CYCLE_INTERVAL_MS, NOC_WEBHOOK_PORT; integration API keys (VERTIV_API_KEY, etc.).

**Step 3: Commit**

```bash
git add products/datacenter-noc/scheduler.mjs products/datacenter-noc/README.md
git commit -m "feat(noc): scheduler and webhook trigger"
```

---

## Task 11: Phase 1 — shadow mode (read-only)

**Files:**
- Modify: `hive-mind-agent-general/products/datacenter-noc/runner.mjs` or `tools.mjs`
- Modify: `hive-mind-agent-general/products/datacenter-noc/noc.config.example.json`

**Step 1: Add shadow mode flag**

Config option `shadowMode: true`. When true, tools acknowledge_alert, run_remediation, create_ticket, update_ticket, notify do not call the adapter; they log " shadow: would call X with Y" and return success. complete_task and read/write_context still work so outcomes are written.

**Step 2: Document**

README: "Phase 1: set shadowMode: true to run triage and write recommendations to outcomes without acting on DCIM/ticketing."

**Step 3: Commit**

```bash
git add products/datacenter-noc/runner.mjs products/datacenter-noc/tools.mjs products/datacenter-noc/README.md
git commit -m "feat(noc): shadow mode for Phase 1 rollout"
```

---

## Task 12: Tests and README

**Files:**
- Modify: `hive-mind-agent-general/products/datacenter-noc/test/*.test.mjs`
- Modify: `hive-mind-agent-general/products/datacenter-noc/README.md`

**Step 1: Add test for allow-list**

In test/tools.test.mjs: run_remediation with procedureId not in allowList returns { ok: false }.

**Step 2: Add test for shadow mode**

When shadowMode true, create_ticket does not call adapter but returns success; outcome still written (mock runCycle or tool invocation).

**Step 3: README**

Sections: Overview, Architecture (link to design doc), Setup (config, env), Running (cycle, scheduler, webhook), Phases (1 shadow, 2 ack+ticket, 3 remediation), Adding adapters (implement interface, register in config).

**Step 4: Run all tests**

Run: `cd products/datacenter-noc && node --test test/*.test.mjs`  
Expected: all PASS.

**Step 5: Commit**

```bash
git add products/datacenter-noc/test/ products/datacenter-noc/README.md
git commit -m "docs(noc): tests and README"
```

---

## Execution handoff

Plan complete and saved to `docs/plans/2026-03-07-datacenter-noc-hive-implementation.md`.

**Two execution options:**

1. **Subagent-driven (this session)** — I dispatch a fresh subagent per task (or batch of small tasks), review between tasks, fast iteration.
2. **Parallel session (separate)** — You open a new session in this repo (or a worktree), paste the plan, and use the executing-plans skill for batch execution with checkpoints.

Which approach do you want?
