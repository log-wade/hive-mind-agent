# Hive Config

Project-agnostic configuration. Targets and paths come from config, not hardcoded rules.

## hive.config.json

Place in the hive root (e.g. `hive-mind-agent/` or project root).

```json
{
  "$schema": "./core/schema/config-schema.json",
  "version": 1,
  "targetProducts": [
    {
      "name": "My Product",
      "path": "/path/to/product",
      "description": "Optional description"
    }
  ],
  "workspaceRoots": ["/path/to/hive", "/path/to/product"],
  "adapters": {
    "context": { "type": "file", "options": {} },
    "outcome": { "type": "file", "options": {} },
    "worker": { "type": "cursor", "options": {} },
    "llm": { "type": "cursor", "options": {} }
  },
  "maxParallelTasks": 3,
  "contextPath": "context.md",
  "outcomesPath": "outcomes"
}
```

## Fields

| Field | Default | Description |
|-------|---------|-------------|
| `targetProducts` | `[]` | Products/projects the hive operates on |
| `workspaceRoots` | `[]` | Root paths for the workspace |
| `adapters.context.type` | `file` | `file` \| `postgres` \| `redis` |
| `adapters.outcome.type` | `file` | `file` \| `blob` \| `postgres` |
| `adapters.worker.type` | `cursor` | `cursor` \| `local` \| `http` \| `mcp` |
| `adapters.llm.type` | `cursor` | `cursor` \| `anthropic` \| `openai` \| `ollama` \| `gemini` |
| `taxonomyPath` | — | Custom agent taxonomy JSON |
| `maxParallelTasks` | `3` | Max parallel subagent tasks per cycle |
| `contextPath` | `context.md` | Path to context file |
| `outcomesPath` | `outcomes` | Path to outcomes directory |

## Adapter Types

### Worker
- **cursor** — Use `mcp_task` when running inside Cursor
- **local** — Spawn child process with task JSON
- **http** — POST to worker API
- **mcp** — Invoke MCP tool `hive_execute_task`

### LLM
- **cursor** — Cursor provides model (default in Cursor)
- **anthropic** — Claude API
- **openai** — GPT API
- **ollama** — Local models
- **gemini** — Google AI
