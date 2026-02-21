# Hive-Mind Agent

**Model-agnostic, project-agnostic, platform-agnostic** multi-agent orchestration. A central brain + subagent hive that works in Cursor, CLI, MCP, or API. Open source (MIT).

## How It Works

- **Central brain** — Sets strategy, assigns tasks, ingests outcomes, updates shared context
- **Workers** — Subagents (via `mcp_task` in Cursor, or local/HTTP adapters) execute tasks
- **Shared state** — `context.md` + `outcomes/` (paths configurable via `hive.config.json`)

## Quick Start

### Install

```bash
# Run without installing (npx)
npx hive-mind-agent init

# Or clone and use locally
git clone https://github.com/hive-mind-agent/hive-mind-agent.git
cd hive-mind-agent && npm install
```

### Bootstrap a New Hive

```bash
cd your-project
npx hive-mind-agent init
# Edit hive.config.json and context.md
```

### Cursor

1. Open your project (with `hive.config.json` or `context.md`)
2. Add the **hive-mind-central-brain** rule (copy from this repo) or **hive-mind-orchestrator** Skill
3. Say: "Advance the hive" or "Unleash the hive"

### CLI

```bash
hive init      # Bootstrap (or: npx hive-mind-agent init)
hive advance   # Inspect context
```

### MCP Server

Add to Cursor MCP config (see [docs/mcp-server.md](docs/mcp-server.md)):

```json
{
  "mcpServers": {
    "hive-mind": {
      "command": "node",
      "args": ["/path/to/hive-mind-agent/mcp-server/index.mjs"],
      "env": { "HIVE_ROOT": "/path/to/your-hive" }
    }
  }
}
```

### API Server

```bash
HIVE_ROOT=/path/to/hive node api-server.mjs
# Or: npm run api
# Endpoints: GET/PUT /api/hive/context, GET /api/hive/config, POST /api/hive/cycle
```

## Structure

```
hive-mind-agent/
├── hive.config.json       # Config (targets, adapters, paths)
├── context.md             # Shared state
├── outcomes/              # Worker outputs
├── core/                  # Adapters (context, outcome, LLM)
├── cli.mjs                # CLI
├── mcp-server/            # MCP tools
├── api-server.mjs         # HTTP API
├── docs/
└── .cursor/rules/         # Central brain rule
```

## Docs

- [Config](docs/config.md) — hive.config.json, adapters
- [MCP Server](docs/mcp-server.md) — Cursor MCP setup
- [API Server](docs/api-server.md) — HTTP API
- [Worker Contract](docs/worker-contract.md) — Task/outcome format
- [Graduation Path](docs/graduation-path.md) — Standalone scaling

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Contributions welcome.

## License

MIT — see [LICENSE](LICENSE).
