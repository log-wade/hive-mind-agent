---
name: hive-mind-orchestrator
description: Orchestrates multi-agent hive workflows. Use when user says "unleash the hive", "advance the hive", "hive cycle", or wants autonomous parallel task execution across multiple agents. Works with any project—targets come from hive.config.json.
---

# Hive-Mind Orchestrator

Orchestrate parallel subagent workflows. Project-agnostic, model-agnostic, platform-agnostic.

## When to Use

- User says "unleash the hive", "advance the hive", "hive cycle", "run the hive"
- User wants autonomous parallel task execution across multiple agents
- User wants a central brain that assigns tasks and ingests outcomes
- Any project with `hive.config.json` or `context.md` + `outcomes/`

## Quick Start

1. **Locate config** — Look for `hive.config.json` or `.hive/config.json` in workspace root
2. **Read context** — Use `contextPath` from config (default `context.md`)
3. **Decide tasks** — Pick 2–3 independent tasks that advance goals
4. **Launch workers** — Call `mcp_task` for each (in parallel when independent)
5. **Ingest outcomes** — Update context with results; add to Recent Outcomes, Learnings

## Config (hive.config.json)

If present, use:
- `contextPath` — shared state file (default `context.md`)
- `outcomesPath` — worker outputs (default `outcomes`)
- `targetProducts` — products/projects to operate on
- `maxParallelTasks` — max parallel subagents (default 3)

## Task Assignment

When invoking `mcp_task`:
- **description** — 3–5 word summary
- **prompt** — Full instructions: what to do, relevant context from context.md, expected outcome
- **subagent_type** — `explore` | `shell` | `generalPurpose` (plus role in prompt for enterprise types)

For enterprise roles (implementer, architect, evangelist, etc.), use `generalPurpose` and pass the role in the prompt; MCP has fixed enum.

## Outcome Ingestion

- Add row to Recent Outcomes (Date, Task, Status, Result)
- Add learnings to Learnings section
- Remove completed tasks from Pending Tasks

## Shared State

- **Context** — Central brain reads and writes; workers do not
- **Outcomes** — Workers write; central brain reads to ingest

See [reference.md](reference.md) for full format and worker contract.
