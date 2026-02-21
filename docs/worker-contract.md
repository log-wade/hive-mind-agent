# Worker Contract

Workers (subagents) receive tasks, execute them using atomic tools, and return structured outcomes.

## Task Input

Workers receive:

| Field | Type | Description |
|-------|------|-------------|
| **task_id** | string | Unique identifier (optional in Cursor; use prompt) |
| **description** | string | Human-readable task description |
| **context** | string | Relevant shared context (goals, prior outcomes) |
| **subagent_type** | string | See [Enterprise Agent Taxonomy](./enterprise-agent-taxonomy.md) |

**Subagent types:**
- **Base:** `explore` (codebase search), `shell` (commands), `generalPurpose` (research, complex tasks)
- **Builder:** `architect`, `implementer`, `reviewer`, `integrator`
- **Operator:** `deployer`, `monitor`, `remediator`, `compliance`
- **Grower:** `researcher`, `optimizer`, `experimenter`, `evangelist`

In Cursor, this is passed via the `mcp_task` tool: `description` + `prompt` (which includes context).

## Worker Behavior

Workers:

- Use **atomic tools** — read_file, write_file, search, call API, etc.
- Operate **autonomously** — they decide how to accomplish the task
- Return a **structured outcome** when done

## Outcome Output

Workers return (in their final response or written to a file):

| Field | Type | Description |
|-------|------|-------------|
| **result** | string | Summary of what was accomplished |
| **status** | enum | `success`, `partial`, `blocked`, `failed` |
| **artifacts** | string[] | Paths to files created (e.g. `outcomes/2024-01-15-task-1.md`) |
| **suggested_follow_ups** | string[] | Optional follow-up tasks for the central brain |

## Example Outcome

```json
{
  "result": "Explored codebase for auth patterns; found 3 files using JWT.",
  "status": "success",
  "artifacts": ["outcomes/2024-01-15-auth-explore.md"],
  "suggested_follow_ups": ["Review auth middleware in src/middleware/auth.ts"]
}
```

## Cursor Subagents

In Cursor, workers are `mcp_task` subagents. They do not have a formal JSON contract — they return natural language. The central brain interprets their response and may ask them to write an outcome file in `outcomes/` using the format above for consistency.
