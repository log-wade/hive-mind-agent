# NOC Hive — Product Brochure

## One-line pitch

NOC Hive is an AI NOC brain for data center operators: it ingests alerts from your DCIM, BMS, and ticketing systems, triages with an LLM, then acknowledges, remediates via API where safe, or escalates to your on-site team—so you get 24/7 incident response without a 24/7 human NOC.

## The problem

- **Missed or delayed alerts** — Off-hours coverage is thin; critical events slip through.
- **Inconsistent triage** — Different operators handle the same alert differently; playbooks are applied unevenly.
- **Handoff gaps** — Escalations lack context; on-site teams waste time reconstructing what happened.
- **Cost of a real 24/7 NOC** — Staffing around the clock is expensive and hard to sustain for single-site or mid-size operators.

## The solution

One AI brain that plugs into your existing stack. NOC Hive **ingests** alerts and optional metrics from DCIM, BMS, and ticketing; **triages** with an LLM that can read detail and apply playbooks; and **acts** by acknowledging alerts, running allowed remediations (resets, setpoints), creating and updating tickets, and notifying. It never does physical work—it escalates with clear instructions so your on-site team knows exactly what to do.

## How it works (high level)

1. **Ingest** — On a schedule (e.g. every 1–5 minutes) or via webhook, the hive reads open alerts, optional metrics, and open tickets from your integrations. Data is normalized so the brain sees a single view.
2. **Triage** — The LLM reasons over context (active incidents, playbooks) and uses tools to read more detail, then decides: acknowledge and remediate, or acknowledge and create/update a ticket and notify.
3. **Act** — Tools call your systems: acknowledge in DCIM/BMS, run an allowed remediation, create or update a ticket, send a notification. Outcomes are persisted for audit and debugging.

No rip-and-replace. You keep your Vertiv, Schneider, ServiceNow, Grafana, PagerDuty—we add the brain on top.

## Why NOC Hive

- **Lower MTTR** — Automated triage and safe remediations (resets, setpoints) cut time-to-resolution for routine events.
- **24/7 consistency** — Same playbooks and escalation rules every hour; no fatigue, no turnover gaps.
- **Safe rollout** — Start in **shadow mode**: the hive triages and writes outcomes but does not touch live systems. Compare to your human NOC, then enable acknowledge and tickets, then add remediation for an allow-listed set of procedures.
- **Built for colo, enterprise, and hyperscale** — Designed for data center incident response; integrates with DCIM, BMS, and ticketing from day one.

## Integrations

- **DCIM / BMS / SCADA** — Alerts, assets, and (where supported) remediation APIs (e.g. Vertiv, Schneider).
- **Ticketing** — ServiceNow, Jira: read open tickets, create and update incidents with full context.
- **Alerting and metrics** — Grafana, PagerDuty; webhook to trigger a triage cycle on demand.
- **Notifications** — Slack, Teams, email via webhooks.

Adapters map vendor APIs to a single tool set; you add new systems by implementing the adapter contract.

## Rollout (phases)

- **Phase 1 — Shadow:** Hive runs triage and writes outcomes only; no acknowledge, remediation, or ticket calls hit production. Use this to validate logic and compare to human NOC.
- **Phase 2 — Acknowledge + ticket:** Enable acknowledge_alert, create_ticket, update_ticket. Keep remediation off until you’re confident.
- **Phase 3 — Remediation:** Add procedure IDs to an allow-list; the hive can run only those (e.g. reset PDU, adjust setpoint). Monitor and expand the list over time.

## Get started

Request a demo or see the product in action: [NOC Hive landing](/noc/) and [Request demo](/noc/#demo). Operators and architects: read the [technical user manual](/noc/manual.html) for setup, configuration, running a single cycle, 24/7 scheduler, and rollout phases.
