# NOC Hive — Technical User Manual

## 1. Overview

NOC Hive runs a **cycle**: it ingests alerts (and optionally metrics and tickets) from your DCIM, BMS, and ticketing systems; triages them with an LLM that can call tools to read more detail, acknowledge alerts, run remediations, create or update tickets, and notify; then persists the outcome. The system is designed to run **on a schedule** (e.g. every 1–5 minutes) or **on demand via webhook**. Each cycle reads and optionally updates **context** (active incidents, playbooks) and writes an **outcome** (triage summary and metadata) for audit and debugging. Physical work is never automated—the hive escalates by creating tickets with clear instructions for on-site staff.

## 2. Prerequisites

- **Node.js** 18 or later.
- **Hive root** — A directory containing:
  - `context.md` (or path set in config) for context storage.
  - `hive.config.json` (or `.hive/config.json`) with at least `adapters.llm` and optional `contextPath`, `outcomesPath`.
- **LLM adapter** — In `hive.config.json`, set `adapters.llm` to `anthropic`, `openai`, or `ollama`. The NOC cycle does not run with `cursor` or an unset adapter.
- **API keys** — Set in the environment (e.g. `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`) as required by the chosen LLM adapter.

## 3. Quick start

1. **Clone or use the repo** — Ensure `hive-mind-agent-general` is available and that the hive root (e.g. a test directory) has `hive.config.json` and optional `context.md`.
2. **Set `HIVE_ROOT`** — Point to the hive root: `export HIVE_ROOT=/path/to/your/hive/root`.
3. **Configure LLM** — In the hive root’s `hive.config.json`, set `"adapters": { "llm": { "type": "anthropic" } }` (or `openai` / `ollama`) and set the corresponding API key in the environment.
4. **Run one cycle** — From the repo root: `HIVE_ROOT=/path node products/datacenter-noc/runner.mjs`. You should see "Cycle complete: …" and an outcome file under the hive root’s outcomes directory.
5. **Run 24/7 (optional)** — `HIVE_ROOT=/path NOC_CYCLE_INTERVAL_MS=60000 NOC_WEBHOOK_PORT=3743 node products/datacenter-noc/scheduler.mjs` to run a cycle every 60 seconds and expose `POST /webhook` for on-demand cycles.

## 4. Configuration

**hive.config.json** (in hive root):

- **contextPath** — Relative path to context file (default: `context.md`).
- **outcomesPath** — Relative path to outcomes directory (default: `outcomes`).
- **adapters.llm** — Required. Object with `type`: `anthropic`, `openai`, or `ollama`. Provider-specific options (e.g. model name) go here; API keys are read from the environment.

**NOC-specific config** — Either in `hive.config.json` under the `noc` key, or in a separate **noc.config.json** in the hive root (same directory as `hive.config.json`). NOC options:

- **remediationAllowList** — Array of procedure IDs the hive is allowed to run via `run_remediation`. Default: `[]`. In Phase 3, add IDs here.
- **shadowMode** — If `true`, the hive never calls acknowledge, remediation, create_ticket, update_ticket, or notify on real systems; it only logs what it would do and writes outcomes. Default: `true` for safe rollout.
- **notifyChannels** — Optional map of channel names to config (e.g. webhook URLs); used by the adapter for `notify`.

**Environment:**

- **HIVE_ROOT** — Absolute or relative path to the hive root. Required when running `runner.mjs` or `scheduler.mjs`.
- **ANTHROPIC_API_KEY** (or **OPENAI_API_KEY**, etc.) — Set for the LLM adapter in use.

## 5. Running a single cycle

**Command:** `HIVE_ROOT=/path/to/hive node products/datacenter-noc/runner.mjs` (run from the repository root so that `products/datacenter-noc` and `core` resolve).

**What it does:**

1. Loads hive config and NOC config (from `noc.config.json` or `hive.config.noc`).
2. Creates the LLM provider and the adapter (currently the mock adapter).
3. Builds tools with the adapter, context read/write, `remediationAllowList`, and `shadowMode`.
4. Reads context and ingests alerts (and can be extended to read metrics/tickets).
5. Runs the tool loop: sends prompt + tool results to the LLM until it returns `complete_task(summary)` or the loop hits the turn limit.
6. Writes an outcome to the hive root’s outcomes directory (slug: `noc-cycle`) and exits.

Exit: success prints "Cycle complete: …"; failure prints the error and exits with code 1.

## 6. Running 24/7 (scheduler and webhook)

**Command:** `HIVE_ROOT=/path NOC_CYCLE_INTERVAL_MS=60000 NOC_WEBHOOK_PORT=3743 node products/datacenter-noc/scheduler.mjs`

- **NOC_CYCLE_INTERVAL_MS** — Milliseconds between cycles (default: 60000).
- **NOC_WEBHOOK_PORT** — If set to a positive number, the scheduler starts an HTTP server on this port and exposes **POST /webhook** to trigger one cycle immediately (in addition to the interval). No auth in the default implementation; secure the endpoint in production.

The scheduler runs cycles in a loop; each cycle is the same as running `runner.mjs` once.

## 7. Rollout phases

- **Phase 1 — Shadow:** Set `shadowMode: true` in NOC config. The hive triages and writes outcomes; no acknowledge, remediation, ticket, or notify calls hit real systems. Use this to validate logic and compare to your human NOC.
- **Phase 2 — Acknowledge + ticket:** Set `shadowMode: false`. The hive can acknowledge alerts and create/update tickets. Keep `remediationAllowList` empty so it does not run remediations.
- **Phase 3 — Remediation:** Add allowed procedure IDs to `remediationAllowList`. The hive may call `run_remediation` only for those IDs. Monitor and expand the list over time.

## 8. Adapters and integrations

The **adapter contract** (see `products/datacenter-noc/adapters/index.mjs`) defines the methods a NOC adapter must implement (or clearly fail):

- **readAlerts(options)** — Returns normalized alerts (id, source, severity, state, asset_id/asset_name, message, timestamp, optional raw).
- **readMetrics(options)** — Optional; returns time-series data.
- **readAssets(filter)** — Optional; asset/site/cabinet metadata.
- **readTickets(options)**, **readTicket(id)** — Open/recent tickets and full ticket detail.
- **acknowledgeAlert(alertId)** — Mark alert acknowledged in the source system.
- **runRemediation(procedureId, params)** — Run an allowed procedure (e.g. reset, setpoint).
- **createTicket(payload)** — Create incident/work order; returns `{ id }`.
- **updateTicket(id, updates)** — Comment or status change.

The **mock adapter** (`adapters/mock.mjs`) implements the contract with in-memory data for development and tests. To add a real integration (e.g. Vertiv, ServiceNow): implement the contract in a new file, then in `runner.mjs` replace or complement the mock adapter and pass config (base URL, etc.) from hive/NOC config; keep API keys in the environment.

## 9. Tools and triage loop

The orchestrator exposes these **tools** to the LLM (see `products/datacenter-noc/tools.mjs`):

- **read_alerts**, **read_metrics**, **read_assets**, **read_tickets**, **read_ticket** — Ingest and detail.
- **acknowledge_alert** — Mark alert acknowledged. In shadow mode, returns `{ ok: true, shadow: true }` and does not call the adapter.
- **run_remediation** — If `procedureId` is not in `remediationAllowList`, returns "Procedure not allowed". In shadow mode, no adapter call.
- **create_ticket**, **update_ticket** — Create/update tickets. Shadow mode returns a shadow id and does not call the adapter.
- **notify** — Send message to a channel. Shadow mode logs only.
- **read_context**, **write_context** — Continuity across cycles.
- **complete_task(summary)** — Ends the cycle; the runner persists the summary as the outcome.

The triage loop runs for up to **MAX_TOOL_TURNS** (30) iterations. The LLM is expected to call tools then respond with `{"complete_task": "summary"}`. If it never sends `complete_task`, the cycle is marked incomplete and an outcome is still written.

## 10. Outcomes and context

**Outcomes** — Written under the hive root’s `outcomesPath` (default: `outcomes`). The NOC runner uses the slug `noc-cycle`; the file name is generated by the core outcome store (typically slug + timestamp). Each file contains the triage summary and generation time. Use the core `listOutcomes` / `readOutcome` (or the CLI/API if available) to inspect outcomes for debugging.

**Context** — Stored in the file at `contextPath` (default: `context.md`). The hive can read and write context (e.g. active incidents, playbooks) via the `read_context` and `write_context` tools. Content is free-form; the LLM uses it for continuity across cycles.

## 11. Troubleshooting

- **"Set adapters.llm in hive.config.json …"** — Ensure `hive.config.json` (or `.hive/config.json`) has `adapters.llm` with `type` set to `anthropic`, `openai`, or `ollama`. Do not use `cursor` or leave the adapter unset for NOC cycles.
- **Cycle incomplete (max turns)** — The LLM did not return `complete_task` within the turn limit. Check prompts and model; consider increasing `MAX_TOOL_TURNS` in `runner.mjs` for complex triage, or simplify the alert set for testing.
- **Tool errors** — Check adapter implementation and API keys. For the mock adapter, ensure it is returning the expected shapes. In shadow mode, write operations do not hit the adapter; if you expect real writes, set `shadowMode: false`.
- **No outcomes written** — Ensure the hive root is writable and `outcomesPath` is correct. Check that the runner is not exiting early due to an uncaught error before `writeOutcome`.
- **Shadow mode behavior** — Verify `noc.config.json` or `hive.config.noc` has `shadowMode: true` if you intend to run in shadow; the default in the example config is `true`.

## 12. Reference

- **Design doc:** [2026-03-07-datacenter-noc-hive-design.md](plans/2026-03-07-datacenter-noc-hive-design.md)
- **Implementation plan:** [2026-03-07-datacenter-noc-hive-implementation.md](plans/2026-03-07-datacenter-noc-hive-implementation.md)
- **Product tree:** `hive-mind-agent-general/products/datacenter-noc/` — runner.mjs, scheduler.mjs, tools.mjs, prompts.mjs, adapters/, context.mjs, noc.config.example.json
