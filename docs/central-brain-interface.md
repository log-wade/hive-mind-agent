# Central Brain Interface

The central brain is the orchestrator of the hive-mind. It sets strategy, assigns tasks, ingests outcomes, and updates shared context.

## Inputs

The central brain receives:

| Input | Description |
|-------|-------------|
| **Current goals** | High-level objectives the hive is working toward |
| **Shared context** | `context.md` — goals, strategy, pending tasks, recent outcomes, learnings |
| **Completed task outcomes** | Structured results from workers (see [worker-contract.md](./worker-contract.md)) |

## Outputs

The central brain produces:

| Output | Description |
|--------|-------------|
| **New/updated goals** | Refined or new objectives based on outcomes |
| **Task assignments** | Who does what — task descriptions for subagents (mcp_task) |
| **Shared context updates** | Edits to `context.md` — strategy, learnings, outcome digest |
| **Decision** | Next steps: assign more tasks, declare done, or request human input |

## Cursor Implementation

In Cursor, the central brain is the main agent. It has access to:

- **read_file** — Read `context.md` and outcome files
- **write_file** — Update `context.md` with new goals, strategy, learnings
- **mcp_task** — Launch worker subagents with task descriptions

### System Behavior

1. Read shared context from `context.md`
2. Decide 2–3 independent tasks that advance current goals
3. Launch 2–3 `mcp_task` subagents in parallel with clear task descriptions
4. Collect results when subagents complete
5. Update `context.md` with outcome digest and learnings
6. Decide next steps: more tasks, done, or human input

### Subagent Task Description Format

When invoking `mcp_task`, provide:

```
subagent_type: explore | shell | generalPurpose | [other]
description: [Clear task description]
prompt: |
  [Detailed instructions for the worker]
  - Relevant context: [summarize from context.md]
  - Expected outcome: [what to return]
```
