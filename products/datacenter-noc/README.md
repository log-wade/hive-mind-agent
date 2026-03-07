# Datacenter NOC Hive

NOC hive for data center incident response. Integrates with DCIM/BMS/ticketing; triages with an LLM; acknowledges, remediates (allow-list), or escalates via tickets.

## Overview

The NOC hive runs a **cycle**: ingest alerts (and optional metrics/tickets), triage with an LLM that can call tools (read, acknowledge, remediate, create ticket, notify), then persist the outcome. It is designed to run 24/7 via a scheduler or webhook.

## Architecture

See [design doc](../../docs/plans/2026-03-07-datacenter-noc-hive-design.md): ingest → triage (LLM + tools) → act → persist. One adapter per integration (DCIM, BMS, ticketing); atomic tools; remediation allow-list; shadow mode for safe rollout.

## Setup

1. **Hive root** — A directory with `context.md` and `hive.config.json` (see hive-mind-agent-general root).
2. **LLM** — In `hive.config.json`, set `adapters.llm` to `anthropic`, `openai`, or `ollama`. Set `ANTHROPIC_API_KEY` (or equivalent) in the environment.
3. **NOC config** — In hive root, either:
   - Add a `noc` key to `hive.config.json`: `"noc": { "remediationAllowList": [], "shadowMode": true }`, or
   - Create `noc.config.json` (see `noc.config.example.json`).
4. **Adapter** — Today only the mock adapter is included. Add real adapters (Vertiv, ServiceNow, etc.) by implementing the interface in `adapters/index.mjs` and wiring them in the runner.

## Running

- **Single cycle:** `HIVE_ROOT=/path/to/hive node runner.mjs` (or from repo root: `HIVE_ROOT=/path node products/datacenter-noc/runner.mjs`).
- **Scheduler (interval + optional webhook):** `HIVE_ROOT=/path NOC_CYCLE_INTERVAL_MS=60000 NOC_WEBHOOK_PORT=3743 node scheduler.mjs`. Runs a cycle every N ms and exposes `POST /webhook` to trigger a cycle on demand.

## Phases

- **Phase 1 — Shadow:** Set `shadowMode: true` in NOC config. Triage runs and writes outcomes; no acknowledge/remediation/ticket/notify calls hit real systems.
- **Phase 2 — Acknowledge + ticket:** Set `shadowMode: false`. Hive can acknowledge alerts and create/update tickets. Keep `remediationAllowList` empty.
- **Phase 3 — Remediation:** Add allowed procedure IDs to `remediationAllowList`. Hive can call `run_remediation` for those only.

## Adding adapters

Implement the adapter contract (see `adapters/index.mjs` and `adapters/mock.mjs`): `readAlerts`, `readMetrics`, `readTickets`, `readTicket`, `acknowledgeAlert`, `runRemediation`, `createTicket`, `updateTicket`. Register the adapter in the runner (replace or complement the mock) and add config for base URL and API keys (env only).
