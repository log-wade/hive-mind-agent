# Agentic Workflows: 24/7/365

Run agentic workflows continuously—scheduled or always-on—so your hive advances even when Cursor is closed.

## What “24/7 agentic” means

- **Agentic**: An LLM (and optionally tools) operates in a loop to achieve an outcome; behavior is defined by prompts and primitives, not hard-coded steps.
- **24/7/365**: Execution is triggered by **time** (cron) and/or **events** (webhooks), on infrastructure that runs independently of your IDE.

Cursor is session-bound. True 24/7 requires a **runner** that lives on a server, serverless function, or orchestration platform.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  SCHEDULER (always running)                                      │
│  • Cron / systemd / Kubernetes / Trigger.dev / Temporal          │
│  • Reads workflow definitions (schedule + prompt + LLM config)    │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  WORKFLOW RUNNER (this repo: workflows/runner.mjs)               │
│  • Loads context.md (goals, pending tasks, learnings)             │
│  • Renders prompt from template ({{context}}, {{date}}, …)       │
│  • Calls LLM (Anthropic / OpenAI / Ollama)                       │
│  • Writes outcome to outcomes/YYYY-MM-DD-slug.md                 │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  HIVE STATE                                                      │
│  • context.md (goals, strategy, pending, learnings)               │
│  • outcomes/ (one file per run)                                  │
│  • hive.config.json (contextPath, outcomesPath, adapters.llm)    │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment options

| Option | Pros | Cons | Best for |
|--------|------|------|----------|
| **VPS + cron + Node** | Full control, simple, no vendor lock-in | You manage OS, Node, restarts | Single box, low cost |
| **systemd timer** | Survives reboots, logs to journald | Linux only | Dedicated server |
| **Docker + cron** | Reproducible, same env everywhere | Need to run cron inside container or host cron | Teams, CI-like runs |
| **Trigger.dev / Inngest** | Managed queues, retries, no server | External service, possibly paid | Production, scale |
| **Temporal** | Durable workflows, retries, observability | Heavier setup | Complex, multi-step workflows |
| **Serverless cron (Vercel, AWS EventBridge)** | No server to maintain | Cold starts, timeout limits | Simple, low-frequency jobs |

## Quick start (local or VPS)

1. **LLM for headless runs**  
   In `hive.config.json`, set an LLM adapter that doesn’t require Cursor:

   ```json
   "adapters": {
     "llm": { "type": "anthropic", "model": "claude-sonnet-4-20250514" }
   }
   ```

   Set `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY` / Ollama) in the environment.

2. **Define workflows**  
   Copy `workflows/workflows.example.json` to `workflows/workflows.json` and edit:

   - `schedule`: cron expression (e.g. `0 6 * * *` = 06:00 daily).
   - `systemPrompt` / `promptTemplate`: use placeholders `{{context.raw}}`, `{{date}}`, `{{goals}}`, `{{strategy}}`, `{{pendingTasks}}`, `{{learnings}}`, `{{outcomeSlug}}`.

3. **Run the scheduler**  
   From the hive root (or set `HIVE_ROOT`):

   ```bash
   node workflows/runner.mjs
   ```

   The process runs forever and triggers each workflow at its schedule. For production, run under systemd, Docker, or a process manager (e.g. PM2).

## Running 24/7 in production

### Option A: systemd (Linux server)

```ini
# /etc/systemd/system/hive-workflows.service
[Unit]
Description=Hive agentic workflow runner
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/hive-mind-agent-general
Environment=HIVE_ROOT=/path/to/your/hive/root
Environment=ANTHROPIC_API_KEY=sk-...
ExecStart=/usr/bin/node workflows/runner.mjs
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable hive-workflows
sudo systemctl start hive-workflows
```

### Option B: Cron (any OS)

Run the runner once per minute; it only executes workflows whose cron expression matches the current time:

```cron
* * * * * cd /path/to/hive-mind-agent-general && HIVE_ROOT=/path/to/hive node workflows/runner.mjs --tick
```

Or run a single workflow by ID:

```cron
0 6 * * * cd /path/to/hive-mind-agent-general && HIVE_ROOT=/path/to/hive node workflows/runner.mjs --run=daily-digest
```

(Implement `--tick` / `--run` in runner if you want one-shot invocations; otherwise the runner is long-lived and uses in-process cron.)

### Option C: Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ENV HIVE_ROOT=/data
VOLUME /data
CMD ["node", "workflows/runner.mjs"]
```

Run with a bind mount for your hive root and env for API keys.

### Option D: Trigger.dev / Inngest

Use the **Hive API** instead of the runner directly:

- Deploy `api-server.mjs` (e.g. to Fly.io, Railway, or a VPS).
- Set `adapters.llm` to `anthropic` or `openai` so `POST /api/hive/cycle` runs the central brain in the cloud.
- In Trigger.dev or Inngest, create a scheduled job that calls `POST https://your-hive-api/api/hive/cycle` (with `X-Hive-API-Key` if set).

The API currently returns *tasks* for the cycle; worker execution is still Cursor/MCP. For full 24/7 agent loops with tools, extend the API or run `workflows/runner.mjs` with workflow definitions that include tool-use when the LLM adapter supports it.

## Workflow definition format

Each entry in `workflows/workflows.json`:

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique key (e.g. `daily-digest`). |
| `name` | Yes | Human-readable name. |
| `schedule` | Yes | Cron expression (e.g. `0 6 * * *`). |
| `systemPrompt` | Yes | System prompt for the LLM. |
| `promptTemplate` | Yes | User prompt; may use `{{context.raw}}`, `{{date}}`, etc. |
| `outcomeSlug` | Yes | Slug for the outcome file (e.g. `daily-digest`). |

Optional: `enabled` (default `true`), `timezone` (for cron).

## Security and safety

- **Secrets**: Never commit API keys. Use env vars or a secret manager; the runner reads `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` from the environment.
- **Scope**: The runner only reads/writes under `HIVE_ROOT` (context and outcomes). It does not execute arbitrary shell commands unless you add that as a tool later.
- **Rate limits**: Respect LLM provider rate limits; avoid scheduling too many workflows in the same minute.
- **Idempotency**: Writing outcomes with a date+slug is naturally idempotent per day; duplicate runs append or overwrite depending on your slug strategy.

## Extending to full agent loops (future)

Today the runner does **single-turn** workflows: one LLM call per run, result written to outcomes. To support **multi-turn agent loops** (LLM + tools until `complete_task`):

1. Extend the LLM adapter to support **tool use** (e.g. Anthropic/OpenAI tool_use blocks).
2. Implement primitive tools in the runner: `read_file`, `write_file`, `list_dir`, `complete_task`, scoped to `HIVE_ROOT`.
3. Add a workflow type `"promptType": "agent_loop"` with optional `maxSteps`; runner loops until completion or limit.

That aligns with the **agent-native** principles: atomic tools, outcome defined by prompt, agent operates in a loop until done.
