# Hive MCP Server

Exposes hive context and outcomes as MCP tools. Use from any MCP client (Cursor, VS Code, CLI).

## Setup

1. Install dependencies: `npm install`
2. Add to Cursor MCP config (`.cursor/mcp.json` or user settings):

```json
{
  "mcpServers": {
    "hive-mind": {
      "command": "node",
      "args": ["/path/to/hive-mind-agent/mcp-server/index.mjs"],
      "env": {
        "HIVE_ROOT": "/path/to/your-hive"
      }
    }
  }
}
```

Replace `/path/to/hive-mind-agent` with the package install path (e.g. `node_modules/hive-mind-agent` if installed locally, or the path from `npm root -g`/package for global install). Replace `/path/to/your-hive` with your hive project directory.

## Tools

| Tool | Description |
|------|-------------|
| `hive_read_context` | Read shared context (goals, strategy, outcomes, learnings) |
| `hive_write_context` | Write updated context markdown |
| `hive_list_outcomes` | List outcome files (newest first) |
| `hive_read_outcome` | Read a single outcome file by filename |
| `hive_get_config` | Get hive configuration |

All tools accept optional `root` to override `HIVE_ROOT` for the request.
