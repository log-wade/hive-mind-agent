# Datacenter NOC Hive — Design

**Date:** 2026-03-07  
**Goal:** A hive mind that autonomously operates a data center (incident response first), better than a human team, with zero human assistance except physical work on site. Integrates with existing DCIM/BMS/SCADA/ticketing.

---

## 1. Architecture and data flow

### High-level

- **Hive orchestrator** = NOC brain. Long-lived process (or systemd service). Maintains **context** (active incidents, playbooks, escalation rules) and **outcomes** (what it did and why). Reads from DCIM/BMS/SCADA/ticketing; acts via their APIs where allowed (acknowledge, remediate, create/update tickets).
- **Triggering:** (1) **Scheduled** — e.g. every 1–5 min: ingest alerts/metrics, triage, act. (2) **Event-driven** — webhook from alerting (Grafana, PagerDuty, DCIM) to run a cycle immediately.
- **Data flow:**
  1. **Ingest** — Tools call vendor APIs; results normalized (alert id, source, severity, asset, timestamp).
  2. **Triage** — Orchestrator (LLM + rules) correlates, assigns severity, picks playbook or “escalate to physical.”
  3. **Act** — Tools: acknowledge, run_remediation, create/update ticket, notify.
  4. **Persist** — Outcomes + optional context update (active incidents, ticket refs).
- **Physical work:** Never automated. Hive creates tickets with clear instructions and assigns to on-site team.

### Where it lives

- Reuse **hive-mind-agent-general** (context, outcomes, 24/7 runner, LLM adapters).
- Add **datacenter-noc** product: config (APIs, site), tool implementations per vendor, prompts (triage policy, escalation).
- One adapter per system (Vertiv, Schneider, ServiceNow, Grafana, etc.) exposing the same atomic tools.

---

## 2. Tool set and integration contracts

### Ingest (read-only)

| Tool | Purpose | Integration |
|------|---------|-------------|
| `read_alerts(source?, since?)` | Open/recent alerts | DCIM/BMS/SCADA, Grafana, PagerDuty |
| `read_metrics(asset_id?, metric_names?, range)` | Time-series (temp, power, etc.) | Grafana/Prometheus, vendor APIs |
| `read_asset(asset_id)` / `read_assets(filter)` | Asset/site/cabinet metadata | DCIM |
| `read_tickets(status?, queue?)` | Open/recent tickets | ServiceNow, Jira |
| `read_ticket(ticket_id)` | Full ticket + history | Same |

### Act (write/execute)

| Tool | Purpose | Integration |
|------|---------|-------------|
| `acknowledge_alert(source, alert_id)` | Mark acknowledged | DCIM/BMS/SCADA alert API |
| `run_remediation(procedure_id, params)` | Run allowed procedure (reset, setpoint) | BMS/DCIM automation API |
| `create_ticket(title, body, priority, assignee?)` | Open incident/work order | ServiceNow, Jira |
| `update_ticket(ticket_id, body?, status?)` | Comment, status change | Same |
| `notify(channel, message)` | Slack/Teams/email | Webhook/notification API |

### Hive-internal

| Tool | Purpose |
|------|---------|
| `complete_task(summary, outcome_path?)` | End cycle; persist to outcomes |
| `read_context()` / `write_context(updates)` | Continuity across cycles |

### Integration contract

- One adapter per system; maps vendor API → normalized alert/asset/ticket shape.
- Config: base URLs, instance names in hive config; API keys in env.
- Idempotency: acknowledge/update_ticket safe to retry; run_remediation guarded (e.g. “already run for this alert in last N minutes”).

### Normalized alert shape

- `id`, `source`, `severity`, `state`, `asset_id`/`asset_name`, `message`, `timestamp`, optional `raw`.

### Escalation to physical

- No physical-action tools. Use `create_ticket` + `update_ticket` (link alert) + `notify` with clear instructions and assignee/queue.

---

## 3. Triage loop, prompts, and escalation rules

### Triage loop (one cycle)

1. Load context (active incidents, playbooks, site summary).
2. Ingest: read_alerts, optional read_metrics, read_tickets.
3. Reason: LLM with tools in a loop (can read more detail, then act).
4. Act: acknowledge, run_remediation, create/update ticket, notify.
5. Persist: complete_task; optional context update.

### System prompt (core)

- Role: NOC brain; triage, correlate, remediate via API or escalate; no physical work.
- Inputs: context, ingested alerts/metrics, open tickets; use tools for more detail.
- Rules: Acknowledge only after decision; one ticket per incident; only allowed procedures; if unsure, escalate with “needs human verification.”
- Output: For each alert group — acknowledge + remediate OR acknowledge + ticket + notify; end with complete_task(summary).

### Escalation rules

- **Always escalate:** Fire, smoke, security, physical damage, “replace hardware,” “inspect in person,” or procedure not in allow-list.
- **Remediate when possible:** Resets, setpoint changes, procedures in config allow-list.
- **Correlation:** Same asset/row/time → one incident; escalation text lists related alert IDs and what was checked.
- **Optional guardrails:** Before run_remediation, validate procedure_id against allow-list and alert_id against “already remediated.”

### Context shape

- Active incidents (alert group id, ticket id, status, last updated).
- Playbooks / procedures (name, id, description, “safe for auto” or procedure_ids allow-list).
- Optional site summary (rows/cabinets, critical assets).
- Recent outcomes (last N triage summaries).

### Failure and retries

- No complete_task or timeout: log partial run to outcomes; optionally notify “Triage cycle incomplete.” Next cycle re-ingests.
- Tool errors: model can retry or escalate (“DCIM unreachable; check Vertiv UI”).

---

## 4. Error handling, safety, and rollout

### Error handling

- Tool failure: structured error; orchestrator continues other sources; model notes in outcome; optional notify.
- LLM timeout / no complete_task: stop after N turns or wall-clock; write partial outcome; optional notify.
- Malformed API response: adapter returns safe error; no hallucinated alert data.

### Safety

- Remediation allow-list only; unknown procedure → “Procedure not allowed,” model escalates.
- No physical-action tools; only vendor-supported automation.
- Audit trail: every tool call and outcome logged; optional SIEM/audit forward.
- Secrets in env/secret manager only.

### Rollout

- **Phase 1 — Read-only + shadow:** Ingest and write triage to outcomes only; no acknowledge/remediation/ticket. Compare to human NOC.
- **Phase 2 — Acknowledge + ticket:** Enable acknowledge_alert, create_ticket, update_ticket. Remediation off.
- **Phase 3 — Remediation:** Enable run_remediation for small allow-list; monitor; expand list over time.
- **Ongoing:** New integrations as adapters; extend playbooks; measure MTTR and escalation quality.

### Success criteria (incident response)

- MTTR for auto-remediable events below human baseline.
- Near-zero missed or duplicate acknowledgments; no duplicate remediation (allow-list + idempotency).
- Escalation quality: hive-created tickets accurate and actionable for on-site staff.
