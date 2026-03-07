# 24/7 Agentic Workflows

Scheduled workflows that run **without Cursor**: the runner calls your LLM on a cron schedule and writes outcomes into the hive.

## Setup

1. In your **hive root** (the directory that has `context.md` and `hive.config.json`), set the LLM to a headless provider in `hive.config.json`:
   ```json
   "adapters": {
     "llm": { "type": "anthropic", "model": "claude-sonnet-4-20250514" }
   }
   ```
   Set `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY` for OpenAI, or use `ollama` for local).

2. In that same hive root, create a `workflows` directory and add your workflow definitions:
   ```bash
   cp workflows/workflows.example.json workflows/workflows.json
   ```
   Edit `workflows.json` (schedules and prompts). The runner expects **hive root** to contain both `context.md` (or your `contextPath`) and `workflows/workflows.json`.

3. Run the runner from **this repo** with `HIVE_ROOT` pointing at your hive root:
   ```bash
   HIVE_ROOT=/path/to/your/hive node workflows/runner.mjs
   ```
   Or from this repo: `npm run workflows` (after setting `HIVE_ROOT`).

The process stays running and triggers each workflow at its cron time. For 24/7, run it under systemd, Docker, or a cloud scheduler—see [docs/AGENTIC-WORKFLOWS-24-7.md](../docs/AGENTIC-WORKFLOWS-24-7.md).

## Template variables

In `promptTemplate` you can use:

- `{{context.raw}}` – full context file text  
- `{{date}}` – today YYYY-MM-DD  
- `{{goals}}`, `{{strategy}}`, `{{pendingTasks}}`, `{{learnings}}` – parsed sections  
- `{{outcomeSlug}}` – this workflow’s outcome slug  

## Cron examples

- `0 6 * * *` – every day at 06:00  
- `0 8 * * 1` – every Monday at 08:00  
- `*/15 * * * *` – every 15 minutes (use sparingly with API limits)
