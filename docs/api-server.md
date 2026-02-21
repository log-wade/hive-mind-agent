# Hive API Server

HTTP API for hive context and cycle. Use for integrations, CI, or headless orchestration.

## Run

```bash
HIVE_ROOT=/path/to/hive node api-server.mjs
# Or: npm run api
```

Env:
- `HIVE_ROOT` — Hive directory (default: cwd)
- `PORT` — Port (default: 3742)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/hive/context | Read context as markdown |
| PUT | /api/hive/context | Update context (body: raw markdown) |
| GET | /api/hive/config | Get hive config |
| GET | /api/hive/outcomes | List outcome filenames |
| POST | /api/hive/cycle | Run one cycle (decide tasks via LLM when configured) |

## Headless Cycle

For POST /api/hive/cycle to actually decide tasks, set in hive.config.json:

```json
{
  "adapters": {
    "llm": {
      "type": "anthropic",
      "model": "claude-sonnet-4-20250514",
      "apiKeyEnv": "ANTHROPIC_API_KEY"
    }
  }
}
```

Worker execution (mcp_task, local spawn, HTTP) is not implemented in the API yet; the cycle returns suggested tasks. Full standalone orchestration requires a task queue and worker pool (see graduation-path Phase 2–4).
